/**
 * Shared types for the pluggable LLM chat backend.
 *
 * Adding a new provider?
 *   1. Implement the `LLMProvider` interface in `providers/<name>.ts`
 *   2. Register it in `provider-factory.ts`
 *   3. Set LLM_PROVIDER=<name> in your env
 */

// ── Message types ──────────────────────────────────────────────

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

// ── Provider interface ─────────────────────────────────────────

/**
 * Every LLM provider must implement this interface.
 *
 * `streamChat` receives the full message history (system prompt
 * already prepended by the route handler) and yields text chunks
 * via an async generator.
 */
export interface LLMProvider {
  readonly name: string;

  /** Stream completion chunks as an async iterable of strings. */
  streamChat(messages: ChatMessage[]): AsyncIterable<string>;
}

// ── Provider config ────────────────────────────────────────────

export interface ProviderConfig {
  /** Provider identifier: "openai" | "anthropic" | ... */
  provider: string;
  /** API key (read from env). */
  apiKey: string;
  /** Model to use (e.g. "gpt-4o-mini", "claude-sonnet-4-20250514"). */
  model: string;
  /** Sampling temperature (0‒2). */
  temperature: number;
  /** Maximum tokens in the response. */
  maxTokens: number;
}

// ── API request / response shapes ──────────────────────────────

/** Body the client POSTs to /api/chat. */
export interface ChatRequest {
  messages: ChatMessage[];
}

/** Individual SSE data payload. */
export interface ChatStreamChunk {
  /** "delta" for content chunks, "done" for the final signal. */
  type: "delta" | "done";
  content: string;
}
