/**
 * OpenAI-compatible LLM provider (uses the official OpenAI SDK).
 *
 * Works with any provider that exposes the /v1/chat/completions interface:
 * silra.cn, OpenAI, Together, Groq, local vLLM, etc.
 *
 * Configure via env:
 *   OPENAI_BASE_URL  — custom base URL (e.g. https://api.silra.cn/v1)
 *   LLM_API_KEY      — API key
 *   LLM_MODEL        — model name (e.g. deepseek-v4-flash)
 */

import OpenAI from "openai";
import type { ChatMessage, LLMProvider, ProviderConfig } from "./types";

export function createOpenAIProvider(config: ProviderConfig): LLMProvider {
  const client = new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    apiKey: config.apiKey,
  });

  return {
    name: "openai",

    async *streamChat(messages: ChatMessage[]): AsyncIterable<string> {
      const stream = await client.chat.completions.create({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    },
  };
}
