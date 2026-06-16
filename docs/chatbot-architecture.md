# Financial AI Chatbot — Architecture Document

**Site:** knowledge-base.worldofnoki.com  
**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · Docker → DigitalOcean  
**Last updated:** 2026-06-16  
**Status:** Implementation-ready — core skeleton already exists; this document is the authoritative spec.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Component Diagram](#2-component-diagram)
3. [File Map](#3-file-map)
4. [API Contract](#4-api-contract)
5. [LLM Abstraction Interface](#5-llm-abstraction-interface)
6. [Provider Implementations](#6-provider-implementations)
7. [React Widget Architecture](#7-react-widget-architecture)
8. [Data Flow — End-to-End](#8-data-flow--end-to-end)
9. [Configuration & Env Vars](#9-configuration--env-vars)
10. [Deployment Integration](#10-deployment-integration)
11. [Security & Rate-Limiting](#11-security--rate-limiting)
12. [Adding a New LLM Provider](#12-adding-a-new-llm-provider)
13. [Known Gaps & Future Work](#13-known-gaps--future-work)

---

## 1. Overview

The chatbot is a **floating widget** embedded globally in the Next.js layout. It connects to a **serverless API route** (`POST /api/chat`) that streams responses via **Server-Sent Events (SSE)** directly from whichever LLM provider is configured. There is no separate backend process — everything runs inside the Next.js Node.js server.

### Design Principles

| Principle | Implementation |
|---|---|
| Provider-agnostic | `LLMProvider` interface + factory pattern; swap with one env var |
| No auth required | Public endpoint; protected by input validation + rate limiting |
| Streaming-first | SSE from server → `ReadableStream` in route → `useChatStream` hook |
| Zero SDK deps for LLM | Raw `fetch` against provider REST APIs — keeps Docker image lean |
| Thin widget | All AI logic in API route, widget is pure UI + SSE consumer |
| Stateless backend | No conversation persistence server-side; history lives in React state |

---

## 2. Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser (Client)                                                   │
│                                                                     │
│  ┌──────────────────────────────────────────────────┐              │
│  │  ChatWidget.tsx  (src/components/chat/)           │              │
│  │  ┌──────────────┐  ┌─────────────────────────┐   │              │
│  │  │  ChatMessage │  │  useChatStream hook      │   │              │
│  │  │  .tsx        │  │  (src/hooks/)            │   │              │
│  │  │              │  │  - messages[]            │   │              │
│  │  │  Renders     │  │  - isStreaming            │   │              │
│  │  │  markdown    │  │  - send() / stop()       │   │              │
│  │  │  per message │  │  - AbortController       │   │              │
│  │  └──────────────┘  └────────────┬────────────┘   │              │
│  └───────────────────────────────── │ ───────────────┘              │
│                                     │ POST /api/chat                │
│                                     │ SSE stream ←                  │
└─────────────────────────────────────│─────────────────────────────-─┘
                                      │ (HTTP / SSE)
                    ┌─────────────────▼──────────────────┐
                    │  Next.js API Route                  │
                    │  src/app/api/chat/route.ts          │
                    │                                     │
                    │  1. Parse & validate ChatRequest    │
                    │  2. Prepend FINANCE_SYSTEM_PROMPT   │
                    │  3. Create ReadableStream (SSE)     │
                    │  4. Call provider.streamChat()      │
                    │  5. Pipe chunks → SSE encoder       │
                    └─────────────────┬──────────────────┘
                                      │ calls
                    ┌─────────────────▼──────────────────┐
                    │  LLM Abstraction Layer              │
                    │  src/lib/llm/                       │
                    │                                     │
                    │  ┌─────────────────────────────┐   │
                    │  │  getProvider()               │   │
                    │  │  provider-factory.ts         │   │
                    │  │                              │   │
                    │  │  Registry map:               │   │
                    │  │  "openai"     → factory fn   │   │
                    │  │  "anthropic"  → factory fn   │   │
                    │  │  "groq"       → factory fn*  │   │
                    │  │  "ollama"     → factory fn*  │   │
                    │  │  (* = add when needed)       │   │
                    │  └───────────┬─────────────────┘   │
                    │              │ returns LLMProvider  │
                    │  ┌───────────▼─────────────────┐   │
                    │  │  LLMProvider interface       │   │
                    │  │  types.ts                    │   │
                    │  │                              │   │
                    │  │  streamChat(messages)        │   │
                    │  │    → AsyncIterable<string>   │   │
                    │  └─────────────────────────────┘   │
                    └─────────────────┬──────────────────┘
                                      │ raw fetch()
          ┌───────────────────────────┼─────────────────────────────┐
          │                           │                             │
┌─────────▼───────┐      ┌────────────▼──────┐      ┌──────────────▼──────┐
│  OpenAI         │      │  Anthropic         │      │  Any OpenAI-compat  │
│  /v1/chat/      │      │  /v1/messages      │      │  (Groq, Together,   │
│  completions    │      │  stream: true      │      │   vLLM, Ollama)     │
│  stream: true   │      │                   │      │  OPENAI_BASE_URL=.. │
└─────────────────┘      └────────────────────┘      └─────────────────────┘
```

### Layer Responsibilities

| Layer | File(s) | Responsibility |
|---|---|---|
| UI Widget | `src/components/chat/ChatWidget.tsx` | Toggle open/close, render panel, submit form |
| Message renderer | `src/components/chat/ChatMessage.tsx` | Lightweight markdown → HTML, streaming cursor |
| Stream hook | `src/hooks/useChatStream.ts` | SSE consumer, message state, abort control |
| API route | `src/app/api/chat/route.ts` | Validate input, inject system prompt, pipe SSE |
| LLM types | `src/lib/llm/types.ts` | Shared TypeScript interfaces |
| LLM factory | `src/lib/llm/provider-factory.ts` | Reads env, caches provider singleton |
| Provider: OpenAI | `src/lib/llm/provider-openai.ts` | OpenAI streaming SSE parser |
| Provider: Anthropic | `src/lib/llm/provider-anthropic.ts` | Anthropic `content_block_delta` SSE parser |
| System prompt | `src/lib/llm/system-prompt.ts` | Finance-scoped instruction set |
| Barrel | `src/lib/llm/index.ts` | Re-exports all public symbols |

---

## 3. File Map

```
knowledge-base/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts          ← POST /api/chat (SSE)
│   │   ├── layout.tsx                ← mounts <ChatWidget /> globally
│   │   └── globals.css               ← .chat-* CSS classes
│   ├── components/
│   │   └── chat/
│   │       ├── ChatWidget.tsx        ← floating FAB + panel
│   │       └── ChatMessage.tsx       ← per-message bubble + markdown
│   ├── hooks/
│   │   └── useChatStream.ts          ← SSE consumer, message state
│   └── lib/
│       └── llm/
│           ├── index.ts              ← barrel export
│           ├── types.ts              ← LLMProvider, ChatMessage, etc.
│           ├── system-prompt.ts      ← FINANCE_SYSTEM_PROMPT constant
│           ├── provider-factory.ts   ← getProvider(), env-driven registry
│           ├── provider-openai.ts    ← OpenAI + OpenAI-compat providers
│           └── provider-anthropic.ts ← Anthropic Claude provider
├── docker-compose.yml                ← LLM env vars injected here
├── Dockerfile                        ← 3-stage Node build → standalone
└── .github/
    └── workflows/
        └── deploy.yml                ← GHA → GHCR → SSH → DO
```

---

## 4. API Contract

### Endpoint

```
POST /api/chat
Content-Type: application/json
```

### Request Schema

```typescript
// Body (JSON)
interface ChatRequest {
  messages: ChatMessage[];   // required, 1–50 items
}

interface ChatMessage {
  role: "user" | "assistant"; // "system" is NOT accepted from clients
  content: string;            // 1–4000 chars, non-empty
}
```

**Example request:**

```json
POST /api/chat
{
  "messages": [
    { "role": "user", "content": "What is cointegration in pairs trading?" },
    { "role": "assistant", "content": "Cointegration means two time series share a common stochastic trend..." },
    { "role": "user", "content": "How do I test for it in Python?" }
  ]
}
```

### Response — Success (200)

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

Stream body — one JSON object per SSE event:

```
data: {"type":"delta","content":"The "}

data: {"type":"delta","content":"Engle-Granger "}

data: {"type":"delta","content":"test uses..."}

data: {"type":"done","content":""}
```

#### SSE Event Schema

```typescript
interface ChatStreamChunk {
  type: "delta" | "done";
  content: string;   // text token for "delta"; empty string for "done"
}
```

| `type` | Meaning | Client action |
|---|---|---|
| `"delta"` | Append `content` to the current assistant message | `lastMessage.content += content` |
| `"done"` | Stream complete (content may contain `[Error: …]` if a failure occurred) | Finalize UI; check for `[Error:` prefix |

#### Error path (streaming errors)

If the LLM call fails mid-stream, the server emits a final `done` event whose `content` starts with `[Error: ...]`. This preserves the SSE contract — the client does not need to distinguish network errors from API errors differently.

```
data: {"type":"done","content":"[Error: OpenAI API 429: rate limit exceeded]"}
```

### Response — Validation Error (400)

```json
{ "error": "string describing what is wrong" }
```

Possible 400 causes:
- Body is not a JSON object
- `messages` is missing or empty
- More than 50 messages
- A message `role` is not `"user"` or `"assistant"`
- A message `content` is empty or longer than 4000 chars

### Response — No provider configured (500)

```json
{ "error": "LLM_API_KEY environment variable is required." }
```

Or:

```json
{ "error": "Unknown LLM_PROVIDER \"xyz\". Available: openai, anthropic" }
```

*(These are returned as SSE `done` events if the error occurs after streaming starts — see error path above.)*

### Validation Rules Summary

| Field | Rule |
|---|---|
| `messages` | Array, length 1–50 |
| `messages[n].role` | `"user"` or `"assistant"` only |
| `messages[n].content` | Non-empty string, ≤ 4000 chars |
| System prompt | **Never** accepted from client — injected server-side only |
| Authentication | None — public endpoint |

---

## 5. LLM Abstraction Interface

The entire provider swap happens by changing a single env var. No application code outside `provider-factory.ts` needs to change.

### Core Interface (`src/lib/llm/types.ts`)

```typescript
/** Every LLM provider must implement this interface — nothing else. */
export interface LLMProvider {
  /** Human-readable name (used in logs / error messages). */
  readonly name: string;

  /**
   * Stream completion chunks as an async iterable of plain strings.
   *
   * - The full message history (including system prompt) is passed in.
   * - Yield raw text deltas — no framing, no JSON, just the text.
   * - Throw on non-recoverable API errors; the route handler wraps them.
   */
  streamChat(messages: ChatMessage[]): AsyncIterable<string>;
}
```

### Provider Config (`src/lib/llm/types.ts`)

```typescript
export interface ProviderConfig {
  provider: string;      // "openai" | "anthropic" | ...
  apiKey: string;        // from LLM_API_KEY
  model: string;         // from LLM_MODEL or per-provider default
  temperature: number;   // from LLM_TEMPERATURE (default 0.7)
  maxTokens: number;     // from LLM_MAX_TOKENS (default 2048)
}
```

### Factory Function Signature

Every provider module exports a single function with this shape:

```typescript
type ProviderFactory = (config: ProviderConfig) => LLMProvider;
```

### Factory Registry (`src/lib/llm/provider-factory.ts`)

```typescript
const factories: Record<string, ProviderFactory> = {
  openai:    createOpenAIProvider,     // also covers Groq, Together, vLLM, Ollama
  anthropic: createAnthropicProvider,
  // groq: createGroqProvider,         // add when needed (uses openai compat)
  // ollama: createOllamaProvider,     // add when needed (uses openai compat)
};
```

The factory is called **once** at first request and the result is cached for the lifetime of the Node.js process — safe because `ProviderConfig` is immutable at runtime.

### Environment Resolution (`getProvider()`)

```
LLM_PROVIDER    →  registry key (default: "openai")
LLM_API_KEY     →  config.apiKey (required)
LLM_MODEL       →  config.model  (optional; falls back to per-provider default)
LLM_TEMPERATURE →  config.temperature (default: 0.7)
LLM_MAX_TOKENS  →  config.maxTokens   (default: 2048)
```

OpenAI-compatible providers also respect:
```
OPENAI_BASE_URL →  base URL override (default: https://api.openai.com/v1)
```

Anthropic respects:
```
ANTHROPIC_BASE_URL →  base URL override (default: https://api.anthropic.com)
```

### Swapping Providers — Zero Code Change

| To use | Set env vars |
|---|---|
| OpenAI GPT-4o | `LLM_PROVIDER=openai` `LLM_MODEL=gpt-4o` `LLM_API_KEY=sk-...` |
| OpenAI GPT-4o-mini | `LLM_PROVIDER=openai` `LLM_MODEL=gpt-4o-mini` `LLM_API_KEY=sk-...` |
| Anthropic Claude Sonnet | `LLM_PROVIDER=anthropic` `LLM_MODEL=claude-sonnet-4-20250514` `LLM_API_KEY=sk-ant-...` |
| Anthropic Claude Haiku | `LLM_PROVIDER=anthropic` `LLM_MODEL=claude-haiku-4-20250514` `LLM_API_KEY=sk-ant-...` |
| Groq (OpenAI-compat) | `LLM_PROVIDER=openai` `LLM_MODEL=llama-3.3-70b-versatile` `LLM_API_KEY=gsk_...` `OPENAI_BASE_URL=https://api.groq.com/openai/v1` |
| Together AI | `LLM_PROVIDER=openai` `LLM_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo` `LLM_API_KEY=...` `OPENAI_BASE_URL=https://api.together.xyz/v1` |
| Local vLLM | `LLM_PROVIDER=openai` `LLM_MODEL=<model-name>` `LLM_API_KEY=dummy` `OPENAI_BASE_URL=http://localhost:8000/v1` |
| Local Ollama | `LLM_PROVIDER=openai` `LLM_MODEL=llama3.2` `LLM_API_KEY=ollama` `OPENAI_BASE_URL=http://localhost:11434/v1` |

---

## 6. Provider Implementations

### 6.1 OpenAI Provider (`provider-openai.ts`)

- **API:** `POST {OPENAI_BASE_URL}/chat/completions` with `stream: true`
- **Auth:** `Authorization: Bearer <LLM_API_KEY>`
- **Streaming format:** OpenAI SSE — `data: {...}\n\n` events, ends with `data: [DONE]`
- **Chunk path:** `json.choices[0].delta.content`
- **Compatible with:** OpenAI, Groq, Together, Fireworks, Perplexity, Azure OpenAI, vLLM, Ollama (via `/v1` endpoint)

```
Upstream SSE line format:
  data: {"id":"...","choices":[{"delta":{"content":"Hello"},...}],...}
  data: [DONE]
```

### 6.2 Anthropic Provider (`provider-anthropic.ts`)

- **API:** `POST {ANTHROPIC_BASE_URL}/v1/messages` with `stream: true`
- **Auth:** `x-api-key: {apiKey}` + `anthropic-version: 2023-06-01`
- **System message handling:** Anthropic requires system as a top-level `system:` field (not in `messages[]`). The provider splits it out automatically from the passed `messages` array.
- **Streaming format:** SSE with typed events

```
Upstream SSE event types (only content_block_delta is consumed):
  data: {"type":"message_start",...}
  data: {"type":"content_block_start",...}
  data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}
  data: {"type":"message_delta",...}
  data: {"type":"message_stop"}
```

- **Chunk path:** `json.delta.text` when `json.type === "content_block_delta" && json.delta.type === "text_delta"`

### 6.3 Adding Groq / Ollama (no new file needed)

Both expose OpenAI-compatible APIs. Use `LLM_PROVIDER=openai` and set `OPENAI_BASE_URL` to the provider's base URL. The `provider-openai.ts` implementation already reads `OPENAI_BASE_URL` from env. See the table in §5 for exact values.

### 6.4 Adding a Fully Custom Provider (new file needed)

See §12 for step-by-step instructions.

---

## 7. React Widget Architecture

### Mount Point

`ChatWidget` is mounted **once** in `src/app/layout.tsx` as a global overlay, so it appears on every page without being re-initialized on route changes:

```tsx
// src/app/layout.tsx
<body className="antialiased">
  {children}
  <ChatWidget />   {/* ← global, persists across navigations */}
</body>
```

### Component Tree

```
ChatWidget.tsx  ("use client")
├── FAB button (fixed, bottom-right)
└── Chat panel (conditional on isOpen)
    ├── Header (title + clear + minimize buttons)
    ├── Messages list
    │   ├── Empty state (prompt suggestions)
    │   ├── ChatMessage.tsx × N
    │   │   ├── User bubble   (plain text, right-aligned)
    │   │   └── Assistant bubble (renderMarkdown() → dangerouslySetInnerHTML)
    │   └── Error banner (red, dismissable)
    └── Input area (form)
        ├── <textarea> (auto-resize, Enter to send, Shift+Enter for newline)
        └── Send / Stop button
```

### `useChatStream` Hook API

```typescript
const {
  messages,      // ChatMessage[] — full conversation history in state
  isStreaming,   // boolean — true while SSE stream is open
  error,         // string | null — last error message
  send,          // (userText: string) => Promise<void>
  stop,          // () => void — aborts in-flight request
  clear,         // () => void — resets all state + aborts
} = useChatStream({ endpoint?: string });  // endpoint defaults to "/api/chat"
```

#### `ChatMessage` Type (client-side)

```typescript
interface ChatMessage {
  id: string;        // crypto.randomUUID()
  role: "user" | "assistant";
  content: string;   // mutated in-place during streaming
  timestamp: number; // Date.now() at creation
}
```

#### State Machine

```
idle
  └─ send(text) ──→ streaming
                      ├─ delta event ──→ streaming  (append to last message)
                      ├─ done event  ──→ idle
                      ├─ stop()      ──→ idle
                      └─ fetch error ──→ idle + error set
```

#### SSE Parsing in the Hook

The hook handles two SSE formats emitted by the route:

1. **Structured** (`data: {...}\n\n`): Parses `parsed.content` (our format), falls back to `parsed.choices[0].delta.content` (raw OpenAI passthrough) and `parsed.token`.
2. **Raw text**: If no `data:` prefix is present in the buffer, treats the raw bytes as text tokens directly (compatibility mode).

### Markdown Rendering

`ChatMessage.tsx` includes a lightweight regex-based markdown renderer (`renderMarkdown()`). It handles:

| Syntax | Output |
|---|---|
| `**bold**` | `<strong>` |
| `*italic*` | `<em>` |
| `` `code` `` | `<code class="chat-inline-code">` |
| ` ```block``` ` | `<pre class="chat-code-block"><code>` |
| `## Heading` | `<div class="chat-h2">` |
| `### Heading` | `<div class="chat-h3">` |
| `- item` / `• item` | `<li class="chat-li">` wrapped in `<ul>` |
| `1. item` | `<li class="chat-li-ordered">` |
| Blank lines | `</p><p>` |

Output is set via `dangerouslySetInnerHTML`. HTML entities (`&`, `<`, `>`) are escaped **before** processing, so user-provided content cannot inject tags.

### CSS Classes (globals.css)

All chat styles live under the `.chat-*` namespace in `src/app/globals.css`:

| Class | Purpose |
|---|---|
| `.chat-fab` | Fixed floating action button |
| `.chat-panel` | Fixed 380×520px panel, slides up on open |
| `.chat-panel-header` | Top bar with title and control buttons |
| `.chat-messages` | Scrollable message list |
| `.chat-input-area` | Bottom form container |
| `.chat-input-row` | Textarea + send button row |
| `.chat-textarea` | Auto-resize textarea |
| `.chat-send-btn` | Blue send button |
| `.chat-stop-btn` | Red stop button (during streaming) |
| `.chat-typing-dots` | Three-dot typing animation |
| `.chat-cursor` | Blinking caret appended during streaming |

Mobile breakpoint (`max-width: 480px`): panel becomes full-width (`calc(100vw - 1rem)`).

---

## 8. Data Flow — End-to-End

```
User types "What is cointegration?" and presses Enter
  │
  ▼
useChatStream.send("What is cointegration?")
  1. Creates userMsg  = { id, role:"user",      content: "What is cointegration?" }
  2. Creates assistantMsg = { id, role:"assistant", content: "" }
  3. setMessages([...prev, userMsg, assistantMsg])
  4. setIsStreaming(true)
  5. new AbortController() → stored in abortRef
  │
  ▼
fetch("POST /api/chat", {
  body: JSON.stringify({
    messages: [
      { role:"user", content:"What is cointegration?" }
      // (all prior history also included for multi-turn)
    ]
  }),
  signal: controller.signal
})
  │
  ▼
route.ts: validateBody()
  - Checks array, length, roles, content length
  - Returns ChatRequest { messages: [...validated] }
  │
  ▼
route.ts: prepend system prompt
  messages = [
    { role:"system", content: FINANCE_SYSTEM_PROMPT },
    { role:"user",   content: "What is cointegration?" }
  ]
  │
  ▼
route.ts: new ReadableStream({ start(controller) { ... } })
  - getProvider() → returns cached LLMProvider
  - provider.streamChat(messages) → AsyncIterable<string>
  │
  ▼ (inside provider.streamChat)
fetch("POST https://api.openai.com/v1/chat/completions", {
  stream: true, model: "gpt-4o-mini", messages: [...], ...
})
  │
  ▼ (upstream SSE chunks arrive)
OpenAI: data: {"choices":[{"delta":{"content":"Coin"}}]}
OpenAI: data: {"choices":[{"delta":{"content":"tegration"}}]}
OpenAI: data: [DONE]
  │
  ▼ (provider yields plain strings)
yield "Coin"
yield "tegration"
  │
  ▼ (route SSE encodes each yield)
controller.enqueue(encode('data: {"type":"delta","content":"Coin"}\n\n'))
controller.enqueue(encode('data: {"type":"delta","content":"tegration"}\n\n'))
controller.enqueue(encode('data: {"type":"done","content":""}\n\n'))
controller.close()
  │
  ▼ (browser receives SSE stream)
useChatStream SSE parser:
  - "delta" → setMessages: last assistant message content += "Coin"
  - "delta" → setMessages: last assistant message content += "tegration"
  - "done"  → setIsStreaming(false)
  │
  ▼
React re-renders ChatMessage with updated content
ChatMessage.tsx: renderMarkdown(content) → HTML
UI: streaming cursor blinks, auto-scrolls to bottom
```

---

## 9. Configuration & Env Vars

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_PROVIDER` | No | `openai` | Provider key — must match a key in the factory registry |
| `LLM_API_KEY` | **Yes** | — | API key for the chosen provider |
| `LLM_MODEL` | No | Per-provider default | Model name override |
| `LLM_TEMPERATURE` | No | `0.7` | Sampling temperature (0–2) |
| `LLM_MAX_TOKENS` | No | `2048` | Max response tokens |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | OpenAI-compat base URL (Groq, Together, vLLM, Ollama) |
| `ANTHROPIC_BASE_URL` | No | `https://api.anthropic.com` | Anthropic base URL override |

### Per-Provider Default Models

| `LLM_PROVIDER` | Default `LLM_MODEL` |
|---|---|
| `openai` | `gpt-4o-mini` |
| `anthropic` | `claude-sonnet-4-20250514` |

### docker-compose.yml injection

```yaml
services:
  web:
    environment:
      - LLM_PROVIDER=${LLM_PROVIDER:-openai}
      - LLM_API_KEY=${LLM_API_KEY}
      - LLM_MODEL=${LLM_MODEL:-}
      - LLM_TEMPERATURE=${LLM_TEMPERATURE:-0.7}
      - LLM_MAX_TOKENS=${LLM_MAX_TOKENS:-2048}
```

Set `LLM_API_KEY` on the DigitalOcean droplet's shell environment or in a `.env` file sourced before `docker run`. The GitHub Actions deploy script does not inject secrets into the container — they must be pre-set on the host.

### Local development

```bash
# .env.local  (gitignored)
LLM_PROVIDER=openai
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```

Next.js automatically loads `.env.local` in `dev` mode. In production (Docker), env vars come from the host shell / `docker run -e`.

---

## 10. Deployment Integration

### Build Pipeline

```
git push main
  │
  ▼
GitHub Actions: .github/workflows/deploy.yml
  │
  ├─ Job 1: build-and-push
  │    docker build . (3-stage)
  │    ├─ Stage 1 (deps):    npm ci --ignore-scripts
  │    ├─ Stage 2 (builder): next build --webpack  (NODE_OPTIONS=--max-old-space-size=768)
  │    └─ Stage 3 (runner):  standalone output, node server.js
  │    docker push ghcr.io/<owner>/knowledge-base:latest + :<sha>
  │
  └─ Job 2: deploy
       SSH to DigitalOcean droplet
       docker pull ghcr.io/<owner>/knowledge-base:latest
       docker stop/rm knowledge-base
       docker run -d -p 3001:3000 \
         --name knowledge-base \
         --restart unless-stopped \
         ghcr.io/<owner>/knowledge-base:latest
       curl -sf http://localhost:3001  # health check
```

### Standalone Output

`next.config.ts` sets `output: "standalone"`. The Docker runner copies only:
- `.next/standalone/` (includes `server.js` + minimal node_modules)
- `.next/static/` (served by Next.js)
- `public/`
- `content/` (MDX source files, read at request time)

LLM env vars are **runtime-only** — they never touch the build stage, which is correct: the Docker image is the same artifact regardless of which provider is used.

### Port mapping

DigitalOcean: container port 3000 → host port 3001. Assumed to sit behind a reverse proxy (nginx/Caddy) that handles TLS and routes `knowledge-base.worldofnoki.com` → `localhost:3001`.

---

## 11. Security & Rate-Limiting

### Current protections (implemented)

| Protection | Implementation |
|---|---|
| Input validation | `validateBody()` in route — rejects bad shapes, oversized content, invalid roles |
| Message count cap | Max 50 messages per request |
| Content length cap | Max 4,000 chars per message |
| System prompt injection | System role is never accepted from the client — always injected server-side |
| HTML escaping | `renderMarkdown()` escapes `&`, `<`, `>` before processing |

### Recommended additions (not yet implemented)

| Gap | Recommendation | Where |
|---|---|---|
| Rate limiting | Add `next-rate-limit` or an `ip-based` token bucket in the route handler | `src/app/api/chat/route.ts` |
| Request origin check | Validate `Origin` header matches `knowledge-base.worldofnoki.com` | Same route |
| Token budget | Track approximate token count across messages, reject if exceeds ~12k | `validateBody()` |
| Abuse monitoring | Log user IP + timestamp + truncated prompt to a log stream | Route handler |
| CORS | Next.js already handles same-origin; add explicit CORS headers if you ever want cross-origin embeds | `next.config.ts` headers |
| Provider key rotation | Store `LLM_API_KEY` in a secret manager; rotate periodically | Ops / GitHub Secrets |

---

## 12. Adding a New LLM Provider

Follow these four steps — no other files need to change:

### Step 1 — Create the provider file

```typescript
// src/lib/llm/provider-groq.ts
import type { ChatMessage, LLMProvider, ProviderConfig } from "./types";

export function createGroqProvider(config: ProviderConfig): LLMProvider {
  // Groq exposes an OpenAI-compatible API, so we can reuse the OpenAI logic.
  // For a truly custom API, implement streamChat from scratch:
  return {
    name: "groq",
    async *streamChat(messages: ChatMessage[]): AsyncIterable<string> {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

      if (!res.ok) throw new Error(`Groq API ${res.status}: ${await res.text()}`);

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
          if (!trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6);
          if (payload === "[DONE]") return;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch { /* skip malformed */ }
        }
      }
    },
  };
}
```

### Step 2 — Register in the factory

```typescript
// src/lib/llm/provider-factory.ts  — add one line
import { createGroqProvider } from "./provider-groq";

const factories: Record<string, ProviderFactory> = {
  openai:    createOpenAIProvider,
  anthropic: createAnthropicProvider,
  groq:      createGroqProvider,       // ← new
};

const defaultModels: Record<string, string> = {
  openai:    "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
  groq:      "llama-3.3-70b-versatile", // ← new
};
```

### Step 3 — Set env vars

```bash
LLM_PROVIDER=groq
LLM_API_KEY=gsk_...
LLM_MODEL=llama-3.3-70b-versatile
```

### Step 4 — Done

No other code changes. The route handler, SSE encoder, and React widget are completely unaware of the provider swap.

> **Tip:** If the new provider speaks the OpenAI `/v1/chat/completions` format, skip Step 1 entirely and just set `OPENAI_BASE_URL` to the provider's endpoint. Steps 2–4 are then also unnecessary — just set `LLM_PROVIDER=openai` and `OPENAI_BASE_URL`.

---

## 13. Known Gaps & Future Work

### High Priority

| Item | Description |
|---|---|
| **Rate limiting** | No per-IP throttle exists. A busy or malicious client can spam the LLM API. Add token-bucket middleware in the route before the stream is created. |
| **Error type in SSE** | Streaming errors are currently smuggled into the `done` event's `content` field as `[Error: ...]`. Consider adding `type: "error"` to `ChatStreamChunk` for cleaner client handling. |
| **Token counting** | No pre-flight token count; a crafty user could push the context near the model's limit. Add a rough estimate check (e.g. `totalChars / 4 < maxContextTokens`). |

### Medium Priority

| Item | Description |
|---|---|
| **Conversation persistence** | Conversations are lost on page refresh. Could be `localStorage`-persisted via the hook, or stored server-side with a session UUID cookie. |
| **Suggested prompts** | The empty state has a text hint; interactive clickable prompt chips would improve UX. |
| **Proper markdown library** | The regex renderer handles common cases but will mis-render edge cases. `react-markdown` + `remark-gfm` is the battle-tested alternative. Adds ~30 kB gzipped. |
| **Streaming abort propagation** | `stop()` aborts the client-side fetch, but the server-side LLM call continues until the upstream provider closes it. Propagating the abort into the `ReadableStream` controller would cancel the upstream fetch too. |
| **Provider health check** | On startup, optionally ping the configured provider to validate the API key and model name. Avoids silent failures at first user message. |

### Low Priority

| Item | Description |
|---|---|
| **Multi-turn context window management** | For very long conversations, the full history is sent each request. A sliding-window trim (keep last N messages or last K tokens) would prevent context overflow. |
| **Typing indicators** | The three-dot animation appears when `content === ""`. Add a server-sent `{"type":"thinking"}` event to drive a dedicated thinking state. |
| **Accessibility** | The widget needs `role="dialog"`, `aria-live="polite"` on the messages container, and keyboard trap management when open. |
| **Dark/light theme sync** | The widget uses hardcoded dark-theme CSS variables. If a light theme is added to the site, the widget CSS should reference the same CSS custom properties. |
