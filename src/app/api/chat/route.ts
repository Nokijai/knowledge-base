/**
 * POST /api/chat
 *
 * Streaming chat endpoint for the knowledge-base financial assistant.
 *
 * Request body: { messages: [{ role, content }] }
 * Response:     text/event-stream (SSE)
 *   data: {"type":"delta","content":"…"}
 *   data: {"type":"done","content":""}
 *
 * The finance system prompt is automatically prepended server-side.
 * The LLM provider is resolved from env (LLM_PROVIDER).
 */

import { NextRequest } from "next/server";
import {
  getProvider,
  FINANCE_SYSTEM_PROMPT,
  SWE_SYSTEM_PROMPT,
  type ChatMessage,
  type ChatRequest,
  type ChatStreamChunk,
} from "@/lib/llm";

// ── Mode ────────────────────────────────────────────────────────

type ChatMode = "finance" | "swe";

const VALID_MODES = new Set<ChatMode>(["finance", "swe"]);

const SYSTEM_PROMPTS: Record<ChatMode, string> = {
  finance: FINANCE_SYSTEM_PROMPT,
  swe: SWE_SYSTEM_PROMPT,
};

// ── Config ─────────────────────────────────────────────────────

const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 4000; // per message, chars
const ALLOWED_ROLES = new Set(["user", "assistant"]);

/**
 * Rough token-budget guard: reject if total chars across all messages
 * implies > ~12 k tokens (1 token ≈ 4 chars).  Prevents context overflow
 * without a real tokenizer dependency.
 */
const MAX_TOTAL_CHARS = 48_000; // ≈ 12 k tokens

// ── Rate limiting ──────────────────────────────────────────────
//
// Simple in-memory token-bucket per IP.
// Limits: 20 requests per 60-second sliding window.
// State lives in the Node.js process — resets on server restart.
// Good enough for a single-instance deployment; swap for Redis-backed
// middleware (e.g. Upstash Ratelimit) for multi-instance deployments.

interface BucketState {
  tokens: number;
  lastRefill: number; // epoch ms
}

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_TOKENS = 20; // requests per window
const buckets = new Map<string, BucketState>();

/** Returns true if the request should be allowed, false if rate-limited. */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket) {
    bucket = { tokens: RATE_LIMIT_MAX_TOKENS, lastRefill: now };
    buckets.set(ip, bucket);
  }

  // Refill proportionally to elapsed time
  const elapsed = now - bucket.lastRefill;
  if (elapsed >= RATE_LIMIT_WINDOW_MS) {
    bucket.tokens = RATE_LIMIT_MAX_TOKENS;
    bucket.lastRefill = now;
  } else {
    const refill = Math.floor(
      (elapsed / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_MAX_TOKENS,
    );
    if (refill > 0) {
      bucket.tokens = Math.min(
        RATE_LIMIT_MAX_TOKENS,
        bucket.tokens + refill,
      );
      bucket.lastRefill = now;
    }
  }

  if (bucket.tokens <= 0) return false;
  bucket.tokens -= 1;
  return true;
}

/** Prune stale bucket entries every ~5 minutes to prevent memory growth. */
let lastPrune = Date.now();
function pruneOldBuckets() {
  const now = Date.now();
  if (now - lastPrune < 5 * 60_000) return;
  lastPrune = now;
  for (const [ip, b] of buckets.entries()) {
    if (now - b.lastRefill > RATE_LIMIT_WINDOW_MS * 2) {
      buckets.delete(ip);
    }
  }
}

// ── Validation ─────────────────────────────────────────────────

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function validateBody(body: unknown): ChatRequest & { mode: ChatMode } {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body must be a JSON object.");
  }

  const { messages, mode: rawMode } = body as Record<string, unknown>;

  // Validate mode (optional, defaults to "finance")
  const mode: ChatMode =
    rawMode === undefined ? "finance" : (rawMode as ChatMode);
  if (!VALID_MODES.has(mode)) {
    throw new ValidationError(
      `Invalid mode "${String(rawMode)}". Allowed: ${[...VALID_MODES].join(", ")}`,
    );
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ValidationError("`messages` must be a non-empty array.");
  }

  if (messages.length > MAX_MESSAGES) {
    throw new ValidationError(`Too many messages (max ${MAX_MESSAGES}).`);
  }

  const validated: ChatMessage[] = [];
  let totalChars = 0;

  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      throw new ValidationError("Each message must be an object.");
    }

    const { role, content } = msg as Record<string, unknown>;

    if (typeof role !== "string" || !ALLOWED_ROLES.has(role)) {
      throw new ValidationError(
        `Invalid role "${String(role)}". Allowed: ${[...ALLOWED_ROLES].join(", ")}`,
      );
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      throw new ValidationError("Message content must be a non-empty string.");
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      throw new ValidationError(
        `Message content too long (max ${MAX_CONTENT_LENGTH} chars).`,
      );
    }

    totalChars += content.length;
    validated.push({ role: role as ChatMessage["role"], content });
  }

  // Token-budget guard (rough estimate: 1 token ≈ 4 chars)
  if (totalChars > MAX_TOTAL_CHARS) {
    throw new ValidationError(
      `Conversation too long. Please start a new chat.`,
    );
  }

  return { messages: validated, mode };
}

// ── SSE helpers ────────────────────────────────────────────────

function sseEncode(chunk: ChatStreamChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

// ── Route handler ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate limiting — derive best-effort client IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  pruneOldBuckets();

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)),
        },
      },
    );
  }

  // Parse & validate
  let body: ChatRequest & { mode: "finance" | "swe" };
  try {
    const raw = await req.json();
    body = validateBody(raw);
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Prepend system prompt based on mode
  const systemPrompt = SYSTEM_PROMPTS[body.mode];
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...body.messages,
  ];

  // Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper: safely enqueue — client may have disconnected.
      function tryEnqueue(data: Uint8Array) {
        try {
          controller.enqueue(data);
        } catch {
          // Controller already closed (client disconnected) — ignore.
        }
      }

      try {
        const provider = getProvider();

        for await (const text of provider.streamChat(messages)) {
          const chunk: ChatStreamChunk = { type: "delta", content: text };
          tryEnqueue(encoder.encode(sseEncode(chunk)));
        }

        // Signal successful completion
        const done: ChatStreamChunk = { type: "done", content: "" };
        tryEnqueue(encoder.encode(sseEncode(done)));
      } catch (err) {
        // Surface error to the client as a terminal SSE event.
        // The client checks for the "[Error:" prefix on `done` events.
        const errorMsg =
          err instanceof Error ? err.message : "Unknown streaming error.";
        const errChunk: ChatStreamChunk = {
          type: "done",
          content: `[Error: ${errorMsg}]`,
        };
        // Second try-catch: controller.enqueue itself can throw if the
        // client disconnected between the streaming error and this point.
        try {
          controller.enqueue(encoder.encode(sseEncode(errChunk)));
        } catch {
          // Client already gone — nothing to do.
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed — safe to ignore.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
