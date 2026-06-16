/**
 * Provider factory — one env var swap to change your LLM backend.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  To add a new provider:                                 │
 * │  1. Create `provider-<name>.ts` exporting a factory fn  │
 * │  2. Import and register it in the `factories` map below │
 * │  3. Set LLM_PROVIDER=<name> in your environment         │
 * └─────────────────────────────────────────────────────────┘
 */

import type { LLMProvider, ProviderConfig } from "./types";
import { createOpenAIProvider } from "./provider-openai";
import { createAnthropicProvider } from "./provider-anthropic";

// ── Provider registry ──────────────────────────────────────────

type ProviderFactory = (config: ProviderConfig) => LLMProvider;

const factories: Record<string, ProviderFactory> = {
  openai: createOpenAIProvider,
  anthropic: createAnthropicProvider,
};

// ── Default model per provider ─────────────────────────────────

const defaultModels: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
};

// ── Public factory ─────────────────────────────────────────────

let _cached: LLMProvider | null = null;

/**
 * Returns (and caches) the configured LLM provider.
 *
 * Reads these env vars:
 *   LLM_PROVIDER   — "openai" | "anthropic" (default: "openai")
 *   LLM_API_KEY    — API key for the chosen provider
 *   LLM_MODEL      — model name override (optional)
 *   LLM_TEMPERATURE — 0‒2 (default: 0.7)
 *   LLM_MAX_TOKENS  — max response tokens (default: 2048)
 */
export function getProvider(): LLMProvider {
  if (_cached) return _cached;

  const providerName = (process.env.LLM_PROVIDER ?? "openai").toLowerCase();
  const factory = factories[providerName];

  if (!factory) {
    throw new Error(
      `Unknown LLM_PROVIDER "${providerName}". ` +
        `Available: ${Object.keys(factories).join(", ")}`,
    );
  }

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_API_KEY environment variable is required.");
  }

  const config: ProviderConfig = {
    provider: providerName,
    apiKey,
    model:
      process.env.LLM_MODEL ?? defaultModels[providerName] ?? "gpt-4o-mini",
    temperature: Number(process.env.LLM_TEMPERATURE ?? "0.7"),
    maxTokens: Number(process.env.LLM_MAX_TOKENS ?? "2048"),
  };

  _cached = factory(config);
  return _cached;
}
