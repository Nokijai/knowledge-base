"use client";

import { useMemo } from "react";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChatStream";

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

/**
 * Lightweight markdown renderer for chat messages.
 * Handles: **bold**, `code`, ```code blocks```, lists, and line breaks.
 * No heavy deps — keeps the bundle small.
 */
function renderMarkdown(text: string): string {
  if (!text) return "";

  let html = text
    // Escape HTML entities
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

    // Code blocks (```...```)
    .replace(
      /```(\w*)\n?([\s\S]*?)```/g,
      '<pre class="chat-code-block"><code>$2</code></pre>',
    )

    // Inline code (`...`)
    .replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>')

    // Bold (**...**)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")

    // Italic (*...*)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")

    // Headers (## ... and ### ...)
    .replace(
      /^### (.+)$/gm,
      '<div class="chat-h3">$1</div>',
    )
    .replace(
      /^## (.+)$/gm,
      '<div class="chat-h2">$1</div>',
    )

    // Unordered lists (• or - or *)
    .replace(/^[•\-\*] (.+)$/gm, '<li class="chat-li">$1</li>')

    // Ordered lists (1. ...)
    .replace(/^\d+\. (.+)$/gm, '<li class="chat-li chat-li-ordered">$1</li>')

    // Wrap consecutive <li> in <ul>
    .replace(
      /((?:<li[^>]*>.*?<\/li>\n?)+)/g,
      '<ul class="chat-ul">$1</ul>',
    )

    // Line breaks (preserve paragraph breaks)
    .replace(/\n\n/g, '</p><p class="chat-p">')
    .replace(/\n/g, "<br />");

  // Wrap in paragraph
  html = `<p class="chat-p">${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p class="chat-p"><\/p>/g, "");

  return html;
}

export default function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";

  const renderedContent = useMemo(() => {
    if (isUser) return null;
    return renderMarkdown(message.content);
  }, [message.content, isUser]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-accent text-white rounded-br-md"
            : "bg-surface border border-border text-foreground rounded-bl-md"
        }`}
      >
        {/* Message content */}
        {isUser ? (
          <div className="chat-msg-content whitespace-pre-wrap break-words">
            {message.content}
          </div>
        ) : (
          <div className="chat-msg-content break-words">
            {message.content ? (
              <div dangerouslySetInnerHTML={{ __html: renderedContent! }} />
            ) : null}
            {isStreaming && !message.content && (
              <span className="chat-typing-dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </span>
            )}
            {isStreaming && message.content && (
              <span className="chat-cursor" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
