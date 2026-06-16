/**
 * Anthropic (Claude) LLM provider.
 *
 * Uses the /v1/messages streaming API.
 * Zero SDK dependencies — uses native `fetch`.
 */

import type { ChatMessage, LLMProvider, ProviderConfig } from "./types";

export function createAnthropicProvider(config: ProviderConfig): LLMProvider {
  const baseUrl =
    process.env.ANTHROPIC_BASE_URL?.replace(/\/+$/, "") ||
    "https://api.anthropic.com";

  return {
    name: "anthropic",

    async *streamChat(messages: ChatMessage[]): AsyncIterable<string> {
      // Anthropic expects system as a top-level param, not in messages[]
      const systemMsg = messages.find((m) => m.role === "system");
      const nonSystemMessages = messages.filter((m) => m.role !== "system");

      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          ...(systemMsg ? { system: systemMsg.content } : {}),
          messages: nonSystemMessages,
          stream: true,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Anthropic API ${res.status}: ${body}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            if (
              json.type === "content_block_delta" &&
              json.delta?.type === "text_delta"
            ) {
              yield json.delta.text;
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    },
  };
}
