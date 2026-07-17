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
import * as Sentry from "@sentry/nextjs";
import { Logger } from "next-axiom";
import {
  getProvider,
  FINANCE_SYSTEM_PROMPT,
  SWE_SYSTEM_PROMPT,
  buildSystemPromptWithContext,
  type ChatMessage,
  type ChatRequest,
  type ChatStreamChunk,
} from "@/lib/llm";
import { getPostBySlug } from "@/lib/content";

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

  const { messages, mode: rawMode, pageSlug: rawPageSlug } = body as Record<string, unknown>;

  // Validate mode (optional, defaults to "finance")
  const mode: ChatMode =
    rawMode === undefined ? "finance" : (rawMode as ChatMode);
  if (!VALID_MODES.has(mode)) {
    throw new ValidationError(
      `Invalid mode "${String(rawMode)}". Allowed: ${[...VALID_MODES].join(", ")}`,
    );
  }

  // Validate pageSlug (optional string, alphanumeric + hyphens, max 100 chars)
  let pageSlug: string | undefined;
  if (rawPageSlug !== undefined) {
    if (typeof rawPageSlug !== "string") {
      throw new ValidationError("`pageSlug` must be a string.");
    }
    if (rawPageSlug.length > 100) {
      throw new ValidationError("`pageSlug` must be 100 characters or fewer.");
    }
    if (!/^[a-zA-Z0-9-]+$/.test(rawPageSlug)) {
      throw new ValidationError("`pageSlug` must contain only alphanumeric characters and hyphens.");
    }
    pageSlug = rawPageSlug;
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

  return { messages: validated, mode, pageSlug };
}

// ── SSE helpers ────────────────────────────────────────────────

function sseEncode(chunk: ChatStreamChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

// ── Route handler ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const log = new Logger({ source: "api/chat" });
  const startMs = Date.now();

  // Rate limiting — derive best-effort client IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  pruneOldBuckets();

  if (!checkRateLimit(ip)) {
    log.warn("Rate limit exceeded", { ip });
    await log.flush();
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
      log.warn("Validation error", { ip, error: err.message });
      await log.flush();
      return Response.json({ error: err.message }, { status: 400 });
    }
    log.warn("Invalid JSON body", { ip });
    await log.flush();
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Resolve system prompt — inject article context if user is on an article page
  let systemPrompt = SYSTEM_PROMPTS[body.mode];
  if (body.pageSlug) {
    const post = getPostBySlug(body.pageSlug);
    if (post) {
      const contentSnippet =
        post.content.length > 8000
          ? post.content.slice(0, 8000) + "\n\n[...article truncated...]"
          : post.content;
      const contextBlock = `## Current Article: "${post.title}"\n\nThe user is currently reading this article. Use it as your primary reference when answering questions.\n\n---\n\n${contentSnippet}`;
      systemPrompt = buildSystemPromptWithContext(SYSTEM_PROMPTS[body.mode], contextBlock);
    }
  }

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

        log.info("LLM stream started", {
          ip,
          mode: body.mode,
          messageCount: body.messages.length,
        });

        for await (const text of provider.streamChat(messages)) {
          const chunk: ChatStreamChunk = { type: "delta", content: text };
          tryEnqueue(encoder.encode(sseEncode(chunk)));
        }

        // Signal successful completion
        const done: ChatStreamChunk = { type: "done", content: "" };
        tryEnqueue(encoder.encode(sseEncode(done)));

        log.info("LLM stream completed", {
          ip,
          mode: body.mode,
          durationMs: Date.now() - startMs,
        });
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown streaming error.";

        // Report to Sentry
        Sentry.captureException(err, {
          extra: { ip, mode: body.mode, messageCount: body.messages.length },
        });

        // Log to Axiom
        log.error("LLM stream error", {
          ip,
          mode: body.mode,
          error: errorMsg,
          durationMs: Date.now() - startMs,
        });

        const errChunk: ChatStreamChunk = {
          type: "done",
          content: `[Error: ${errorMsg}]`,
        };
        try {
          controller.enqueue(encoder.encode(sseEncode(errChunk)));
        } catch {
          // Client already gone — nothing to do.
        }
      } finally {
        await log.flush();
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
