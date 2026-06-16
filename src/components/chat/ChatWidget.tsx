"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChatStream } from "@/hooks/useChatStream";
import ChatMessage from "./ChatMessage";

type ChatMode = "finance" | "swe";

const MODE_CONFIG: Record<
  ChatMode,
  {
    label: string;
    emoji: string;
    ariaLabel: string;
    welcomeTitle: string;
    welcomeBody: string;
    placeholder: string;
    suggestions: string[];
  }
> = {
  finance: {
    label: "Finance",
    emoji: "💰",
    ariaLabel: "Finance AI assistant",
    welcomeTitle: "Ask anything about quant finance",
    welcomeBody:
      "Cointegration, pairs trading, time series analysis, risk models — grounded in the knowledge base.",
    placeholder: "Ask about cointegration, pairs trading…",
    suggestions: [
      "What is cointegration in pairs trading?",
      "Explain the Engle-Granger two-step method",
      "How do I calculate the Hurst exponent?",
      "What is the half-life of mean reversion?",
    ],
  },
  swe: {
    label: "SWE",
    emoji: "💻",
    ariaLabel: "Software Engineering AI assistant",
    welcomeTitle: "Ask anything about software engineering",
    welcomeBody:
      "Algorithms, system design, TypeScript, React, Docker, CI/CD — grounded in the knowledge base.",
    placeholder: "Ask about system design, algorithms, DevOps…",
    suggestions: [
      "Explain time complexity and Big O notation",
      "How does TCP work?",
      "Design a URL shortener",
      "Difference between mutex and semaphore",
    ],
  },
};

interface ChatWidgetProps {
  /** Initial mode – "finance" (default) | "swe" */
  mode?: ChatMode;
}

export default function ChatWidget({ mode: initialMode = "finance" }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<ChatMode>(initialMode);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { messages, isStreaming, error, clearError, send, stop, clear } =
    useChatStream({ mode: activeMode });

  const config = MODE_CONFIG[activeMode];

  // Auto-scroll to bottom on new messages / streaming chunks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isStreaming) return;
      send(input);
      setInput("");
      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    },
    [input, isStreaming, send],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleSuggestion = useCallback(
    (prompt: string) => {
      if (isStreaming) return;
      send(prompt);
    },
    [isStreaming, send],
  );

  const toggleOpen = useCallback(() => setIsOpen((v) => !v), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  const handleModeSwitch = useCallback(
    (newMode: ChatMode) => {
      if (newMode === activeMode) return;
      // Stop any in-progress stream and clear history before switching
      stop();
      clear();
      setActiveMode(newMode);
      setInput("");
      // Re-focus input after mode switch
      setTimeout(() => inputRef.current?.focus(), 50);
    },
    [activeMode, stop, clear],
  );

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={toggleOpen}
        className="chat-fab"
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {isOpen ? (
          // Close (×) icon
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          // Sparkle / AI icon — more professional than a plain chat bubble
          <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="chat-panel"
          role="dialog"
          aria-label={config.ariaLabel}
          aria-modal="false"
        >
          {/* Header */}
          <div className="chat-panel-header">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="font-semibold text-sm text-foreground leading-none">
                  {config.emoji} {config.label} AI
                </div>
                <div className="text-xs text-muted mt-0.5 leading-none">
                  {isStreaming ? "Thinking…" : "Knowledge base assistant"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Mode toggle buttons */}
              <div className="chat-mode-toggle mr-1" role="group" aria-label="Select assistant mode">
                {(Object.keys(MODE_CONFIG) as ChatMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleModeSwitch(m)}
                    className={`chat-mode-btn${activeMode === m ? " chat-mode-btn--active" : ""}`}
                    title={`Switch to ${MODE_CONFIG[m].label} mode`}
                    aria-label={`Switch to ${MODE_CONFIG[m].label} mode`}
                    aria-pressed={activeMode === m}
                  >
                    {MODE_CONFIG[m].emoji} {MODE_CONFIG[m].label}
                  </button>
                ))}
              </div>

              {messages.length > 0 && (
                <button
                  onClick={clear}
                  className="chat-header-btn"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleClose}
                className="chat-header-btn"
                title="Minimize"
                aria-label="Minimize chat"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="chat-messages"
            role="log"
            aria-live="polite"
            aria-label="Conversation"
          >
            {/* Empty / welcome state */}
            {messages.length === 0 && (
              <div className="flex flex-col h-full px-4 pt-4">
                {/* Welcome block */}
                <div className="mb-5">
                  <div className="chat-welcome-icon">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {config.welcomeTitle}
                  </p>
                  <p className="text-xs text-muted leading-relaxed">
                    {config.welcomeBody}
                  </p>
                </div>

                {/* Suggestion chips */}
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted font-medium uppercase tracking-wide mb-0.5">
                    Try asking
                  </p>
                  {config.suggestions.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSuggestion(prompt)}
                      className="chat-suggestion"
                      disabled={isStreaming}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={
                  isStreaming &&
                  msg.role === "assistant" &&
                  i === messages.length - 1
                }
              />
            ))}

            {/* Error banner */}
            {error && (
              <div
                className="chat-error-banner"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <svg
                    className="shrink-0 mt-0.5"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <span className="break-words">{error}</span>
                </div>
                <button
                  onClick={clearError}
                  className="chat-error-dismiss"
                  aria-label="Dismiss error"
                  title="Dismiss"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={handleSubmit} className="chat-input-area">
            <div className="chat-input-row">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={config.placeholder}
                rows={1}
                className="chat-textarea"
                disabled={isStreaming}
                aria-label="Message input"
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stop}
                  className="chat-send-btn chat-stop-btn"
                  title="Stop generating"
                  aria-label="Stop generating"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="chat-send-btn"
                  title="Send message"
                  aria-label="Send message"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              )}
            </div>
            <p className="chat-input-hint">
              Enter to send · Shift+Enter for new line
            </p>
          </form>
        </div>
      )}
    </>
  );
}
