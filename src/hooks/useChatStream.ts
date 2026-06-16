"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface UseChatStreamOptions {
  /** Backend endpoint – defaults to /api/chat */
  endpoint?: string;
}

export function useChatStream(opts: UseChatStreamOptions = {}) {
  const endpoint = opts.endpoint ?? "/api/chat";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const send = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isStreaming) return;
      setError(null);

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: userText.trim(),
        timestamp: Date.now(),
      };

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      setMessages((prev: ChatMessage[]) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          let detail = "";
          try {
            detail = (JSON.parse(body) as { error?: string })?.error ?? "";
          } catch {
            detail = body;
          }
          throw new Error(detail || `Server error (${res.status})`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Support both raw streaming and SSE (data: ...\n\n) formats
          if (buffer.includes("data: ")) {
            const lines = buffer.split("\n");
            buffer = "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed === "data: [DONE]") continue;
              if (trimmed.startsWith("data: ")) {
                try {
                  const parsed = JSON.parse(trimmed.slice(6)) as {
                    type?: string;
                    content?: string;
                    token?: string;
                    choices?: Array<{ delta?: { content?: string } }>;
                  };

                  // Our SSE contract: { type: "done", content: "[Error: …]" }
                  if (parsed.type === "done") {
                    const doneContent = parsed.content ?? "";
                    if (doneContent.startsWith("[Error:")) {
                      // Surface as dismissable error; remove the empty/partial assistant bubble
                      setError(
                        doneContent.replace(/^\[Error:\s*/, "").replace(/\]$/, ""),
                      );
                      setMessages((prev: ChatMessage[]) => {
                        const last = prev[prev.length - 1];
                        if (last?.role === "assistant" && !last.content) {
                          return prev.slice(0, -1);
                        }
                        return prev;
                      });
                    }
                    // Stream complete — finally block will clear isStreaming
                    continue;
                  }

                  // Our SSE contract: { type: "delta", content: "…" }
                  const token: string =
                    (parsed.type === "delta" ? parsed.content : undefined) ??
                    parsed.choices?.[0]?.delta?.content ??
                    parsed.token ??
                    parsed.content ??
                    "";

                  if (token) {
                    setMessages((prev: ChatMessage[]) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last?.role === "assistant") {
                        updated[updated.length - 1] = {
                          ...last,
                          content: last.content + token,
                        };
                      }
                      return updated;
                    });
                  }
                } catch {
                  /* skip non-JSON lines */
                }
              }
            }
          } else {
            // Raw text streaming (no SSE framing)
            const rawChunk = buffer;
            setMessages((prev: ChatMessage[]) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === "assistant") {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + rawChunk,
                };
              }
              return updated;
            });
            buffer = "";
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
        // Remove empty assistant message on error
        setMessages((prev: ChatMessage[]) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && !last.content) {
            return prev.slice(0, -1);
          }
          return prev;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [endpoint, messages, isStreaming],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
    setError(null);
  }, []);

  return { messages, isStreaming, error, clearError, send, stop, clear };
}
