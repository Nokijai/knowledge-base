/**
 * OpenAI-compatible LLM provider.
 *
 * Works with the official OpenAI API as well as any provider that
 * exposes the same /v1/chat/completions streaming interface
 * (Azure OpenAI, Together, Groq, local vLLM, etc.).
 *
 * Zero SDK dependencies — uses native `fetch`.
 */

import type { ChatMessage, LLMProvider, ProviderConfig } from "./types";

export function createOpenAIProvider(config: ProviderConfig): LLMProvider {
  const baseUrl =
    process.env.OPENAI_BASE_URL?.replace(/\/+$/, "") ||
    "https://api.openai.com/v1";

  return {
    name: "openai",

    async *streamChat(messages: ChatMessage[]): AsyncIterable<string> {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          stream: true,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenAI API ${res.status}: ${body}`);
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
          const payload = trimmed.slice(6);
          if (payload === "[DONE]") return;

          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            // skip malformed chunks
          }
        }
      }
    },
  };
}
