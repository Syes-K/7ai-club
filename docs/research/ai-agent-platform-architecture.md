# AI Agent Web Platform — Technical Research & Architecture Analysis

> **Project:** 7ai-club  
> **Date:** June 2026  
> **Status:** Research / Pre-implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Requirements](#product-requirements)
3. [Architecture Option A: n8n Orchestration](#architecture-option-a-n8n-orchestration)
4. [Architecture Option B: Node-Layer Orchestration on Vercel](#architecture-option-b-node-layer-orchestration-on-vercel)
5. [Comparative Analysis](#comparative-analysis)
6. [Recommended Approach](#recommended-approach)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Open Questions](#open-questions)

---

## Executive Summary

This document evaluates two architectural approaches for building an AI agent web platform with the following stack:

- **Frontend:** Next.js + Tailwind CSS (homepage, chat UI)
- **Admin:** shadcn/ui
- **Database:** Supabase (Auth, PostgreSQL, pgvector)
- **Deployment:** Vercel (Next.js application)

**Key finding:** Both approaches are feasible, but they differ significantly in deployment topology, operational complexity, and suitability for real-time chat.

| Approach | Verdict |
|----------|---------|
| **Option A — n8n orchestration** | Feasible, but n8n **cannot** run on Vercel; requires separate hosting |
| **Option B — Node-layer orchestration (Vercel AI SDK)** | **Recommended** for chat-first products; lower latency, simpler deployment, better streaming UX |

The primary engineering challenges across both options are:

1. Dynamic per-assistant MCP configuration (multi-tenant)
2. Knowledge base RAG pipeline (online retrieval vs. offline ingestion)
3. Serverless timeout limits for multi-step agent loops
4. Security (webhook auth, MCP credentials, RLS)

---

## Product Requirements

| # | Requirement | Notes |
|---|-------------|-------|
| 1 | AI chat | Real-time, streaming responses |
| 2 | AI assistant configuration | Per-assistant settings |
| 2a | Knowledge base selection | Assistant binds to one or more KBs |
| 2b | MCP service selection | Assistant connects to configured MCP servers |
| 2c | System prompt | Custom instructions per assistant |
| 3 | Database | Supabase |
| 4 | Frontend | Next.js + Tailwind (homepage + chat page) |
| 5 | Admin UI | shadcn/ui |
| 6 | Conversation orchestration | Originally considered n8n |
| 7 | Deployment | Vercel |

---

## Architecture Option A: n8n Orchestration

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel                                                      │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │ Next.js Frontend │    │ Next.js API Routes           │   │
│  │ (Tailwind)       │    │ Auth / Assistant CRUD        │   │
│  │ shadcn/ui Admin  │    │                              │   │
│  └────────┬─────────┘    └──────────────┬───────────────┘   │
└───────────┼─────────────────────────────┼───────────────────┘
            │ SSE / Webhook               │ CRUD
            ▼                             ▼
┌───────────────────────┐       ┌─────────────────────────────┐
│ n8n (Separate Host)   │       │ Supabase                    │
│ - Webhook Trigger     │       │ - Auth                      │
│ - AI Agent Node       │◄─────►│ - PostgreSQL                │
│ - MCP Client Tool     │       │ - pgvector (KB)             │
│ - Vector Store Tool   │       │ - Storage (documents)       │
└───────────────────────┘       └─────────────────────────────┘
```

### Feasibility Assessment

| Component | Feasible? | Notes |
|-----------|-----------|-------|
| AI chat via n8n | ✅ Yes | n8n 1.106+ supports streaming via Chat Trigger / Webhook |
| Assistant config in Supabase | ✅ Yes | Config passed to n8n via webhook payload |
| Knowledge base / RAG | ⚠️ Moderate | Vector Store Tool or HTTP call to Supabase RPC |
| MCP integration | ⚠️ Moderate | MCP Client Tool (n8n 1.88+); HTTP/SSE only |
| Next.js + Tailwind + shadcn/ui | ✅ Yes | Standard stack |
| Deploy everything on Vercel | ❌ No | n8n requires persistent process + storage |

### n8n Hosting Options

n8n **must** be deployed separately from Vercel:

| Option | Pros | Cons |
|--------|------|------|
| n8n Cloud | Managed, low ops | Cost, customization limits |
| Railway / Render / Fly.io | Relatively simple | Self-managed |
| VPS (Docker) | Full control | Higher ops burden |

### How Assistant Configuration Works

Store configuration in Supabase; pass dynamically to n8n at request time:

```json
{
  "assistant_id": "uuid",
  "system_prompt": "...",
  "knowledge_base_ids": ["kb1", "kb2"],
  "mcp_servers": [{ "url": "...", "token": "..." }],
  "message": "user message",
  "conversation_id": "uuid"
}
```

Use n8n expressions (e.g. `{{ $json.system_prompt }}`) to inject values at runtime — do **not** create one workflow per assistant.

### Suggested Supabase Schema (Conceptual)

```sql
assistants              (id, user_id, name, system_prompt, model, ...)
knowledge_bases         (id, name, embedding_model, ...)
assistant_knowledge_bases (assistant_id, kb_id)
assistant_mcp_servers   (assistant_id, mcp_url, auth_config_encrypted, ...)
conversations           (id, assistant_id, user_id, ...)
messages                (id, conversation_id, role, content, ...)
```

### n8n Capabilities (2026)

- **AI Agent node:** LangChain-based agent with tool support, memory, streaming
- **Streaming:** Chat Trigger or Webhook with `Response Mode: Streaming`; AI Agent with streaming enabled
- **MCP Client Tool:** Connect AI Agent to external MCP servers (SSE / Streamable HTTP)
- **MCP Server Trigger:** Expose n8n workflows as MCP tools to external clients
- **Vector Store Tool:** RAG retrieval within agent workflows
- **Workflow Tool:** Package any n8n workflow as an agent tool

### Key Challenges (Option A)

#### 1. Deployment Split — n8n Cannot Run on Vercel

Vercel is serverless (ephemeral functions, no persistent processes). n8n requires:

- Long-running Node.js process
- Persistent database (SQLite / PostgreSQL)
- SSE long-lived connections

**Impact:** Two systems to deploy, monitor, and secure.

#### 2. Dynamic MCP per Assistant

n8n MCP Client Tool nodes are relatively static in workflow design. When each user configures different MCP servers for their assistants:

- Cannot create one workflow per assistant
- Must pass MCP config via webhook and use dynamic connection patterns

**Mitigation options:**

1. Next.js MCP proxy layer (more flexible)
2. Pre-built n8n sub-workflows + Workflow Tool per MCP type
3. Unified MCP Gateway with permission filtering

#### 3. Streaming Limitations

- Final LLM output can stream; intermediate steps (tool calls, reasoning) are typically **not** streamed to the client
- `Respond to Chat` node finalizes a turn — streaming cannot pass through it mid-chain
- Sequential multi-agent workflows do not produce a unified streaming "thinking" output

#### 4. Knowledge Base RAG

Full pipeline:

```
Upload → Chunk → Embed → Store in pgvector
                              ↓
User query → Retrieve Top-K → Inject context → LLM generate
```

Challenges: embedding model choice, chunking strategy, metadata filtering by `kb_id`, async document processing.

#### 5. Latency & Timeouts

Each chat message: Frontend → Next.js → n8n Webhook → Agent → LLM/Tools → SSE back. Extra hop adds latency.

#### 6. Security

- n8n Webhook must be authenticated (API key / JWT)
- MCP credentials encrypted at rest (Supabase Vault or app-layer encryption)
- Supabase RLS for multi-tenant isolation
- LLM API keys in n8n environment variables only

#### 7. Configuration vs. Orchestration Boundary

| Supabase (Next.js manages) | n8n orchestrates |
|----------------------------|------------------|
| System prompts | Agent reasoning logic |
| KB bindings | RAG retrieval steps |
| MCP server list | Tool call sequencing |
| Model selection | Multi-agent collaboration |
| Users / permissions | External API integrations |

**Principle:** Business config in Supabase; process logic in n8n. Avoid hardcoding prompts in n8n nodes.

---

## Architecture Option B: Node-Layer Orchestration on Vercel

### Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel (Next.js)                                            │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │ Frontend         │    │ app/api/chat/route.ts        │   │
│  │ Tailwind + Chat  │───►│ Orchestration Layer          │   │
│  │ shadcn/ui Admin  │    │ Vercel AI SDK                │   │
│  └──────────────────┘    │ - ToolLoopAgent              │   │
│                          │ - streamText                 │   │
│                          │ - @ai-sdk/mcp                │   │
│                          │ - Custom tools (RAG, DB)     │   │
│                          └──────────────┬───────────────┘   │
└─────────────────────────────────────────┼───────────────────┘
                                          ▼
                              ┌─────────────────────────────┐
                              │ Supabase                    │
                              │ Auth / Config / History / KB│
                              └─────────────────────────────┘
```

### Feasibility Assessment

| Component | Feasible? | Notes |
|-----------|-----------|-------|
| AI chat with streaming | ✅ Yes | Vercel AI SDK + Route Handler SSE |
| Multi-step agent (tool loop) | ✅ Yes | `ToolLoopAgent` (AI SDK 6+) |
| MCP integration | ✅ Yes | `@ai-sdk/mcp` — HTTP/SSE transport only |
| Knowledge base RAG | ✅ Yes | Custom tool + Supabase pgvector |
| Assistant config | ✅ Yes | Load from Supabase per request |
| Full deployment on Vercel | ✅ Yes | Single deployment target |
| Document ingestion (PDF, etc.) | ⚠️ Separate | Too heavy for chat route; use background jobs |

### Recommended Code Structure

```
app/
  api/chat/route.ts           # JWT auth, load config, stream response
  (pages)/                    # Homepage, chat UI
  admin/                      # shadcn/ui admin panels

middleware.ts                 # Refresh JWT session, protect routes

lib/
  supabase/
    client.ts                 # Browser client
    server.ts                 # Server / Route Handler
    middleware.ts
  agents/assistant-agent.ts   # ToolLoopAgent definition
  tools/rag.ts                # Knowledge base retrieval tool
  tools/supabase.ts           # Database tools
  mcp/connect.ts              # Dynamic MCP client per assistant
```

### JWT Authentication (Decided)

Use **Supabase Auth–issued JWTs**; no custom JWT service for MVP.

| Item | Choice |
|------|--------|
| Identity | Supabase Auth (email/password; OAuth as needed) |
| Tokens | Short-lived access JWT + refresh token |
| Next.js | `@supabase/ssr` (App Router) |
| Transport | HttpOnly cookies (SSR default) or `Authorization: Bearer` |
| Validation | `supabase.auth.getUser()` in Route Handlers (verified, not client decode) |
| Data isolation | Postgres RLS via `auth.uid()` / JWT `sub` |
| Privileged key | `service_role` server-only; `anon` in browser |

All business APIs including chat require auth; LLM/MCP secrets never in JWT or client.

### Vercel AI SDK Capabilities (2026)

| Feature | Package / API | Use Case |
|---------|---------------|----------|
| Streaming chat | `streamText`, `useChat` | Real-time UI |
| Agent tool loop | `ToolLoopAgent` | Multi-step reasoning + tools |
| MCP client | `@ai-sdk/mcp`, `createMCPClient` | External MCP tools |
| UI streaming | `createUIMessageStream` | Structured chat UI |

### Typical Chat Route Flow

```typescript
// Conceptual structure
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const { message, assistantId, conversationId } = await req.json();

  // 1. JWT auth (supabase.auth.getUser())
  // 2. Load assistant config (system_prompt, kb_ids, mcp_servers)
  // 3. Load conversation history (Supabase)
  // 4. Assemble tools (RAG + MCP + custom)
  // 5. ToolLoopAgent.stream({ messages })
  // 6. Stream response; persist assistant message on completion

  return agent.stream(...).toUIMessageStreamResponse();
}
```

### Key Challenges (Option B)

#### 1. Serverless Timeout — Highest Priority

With **Fluid Compute** enabled (Vercel default):

| Plan | Max Duration |
|------|--------------|
| Hobby | 300 seconds (5 min) |
| Pro | 800 seconds (~13 min) |

Configure in route:

```typescript
export const maxDuration = 300; // Hobby cap: 300; Pro can go higher
```

Multi-step agent loops accumulate latency quickly:

```
User query → RAG (2s) → LLM (3s) → MCP tool (5s) → LLM (3s) → tool (5s) → generate (10s) ≈ 28s+
```

**Mitigations:**

- Cap `maxSteps` (e.g. 5–8)
- Set timeouts on all upstream `fetch` calls
- Optimize time-to-first-token (parallel auth + config + RAG)
- Offload very complex flows to async jobs (Inngest, Trigger.dev)

> **Note:** Streaming does not fully prevent timeouts. If the handler exceeds `maxDuration`, the connection is cut.

#### 2. Dynamic MCP — Feasible with Constraints

Serverless cannot use **stdio MCP** (local processes). Production requires:

- HTTP transport
- SSE / Streamable HTTP

Per-request pattern:

```typescript
const clients = await Promise.all(
  assistant.mcpServers.map(s =>
    createMCPClient({ transport: { type: 'http', url: s.url } })
  )
);
const tools = await mergeToolSets(clients);
// Close clients after request completes
```

**Challenges:**

- Connection overhead per request (cold start + MCP handshake)
- Credential management (encrypt in Supabase, decrypt at runtime)
- Unreliable user-provided MCP URLs can fail entire conversations
- AI SDK MCP client lacks full session management / resumable streams

**Recommendation:** MCP Gateway proxy for common integrations; restrict arbitrary user URLs in MVP.

#### 3. Knowledge Base — Split Online vs. Offline

| Task | Where |
|------|-------|
| Chat + online RAG retrieval | Vercel Route Handler (~1–3s) |
| Document upload, chunking, batch embedding | Background job (Inngest, Trigger.dev, Supabase Edge Function) |

Do **not** run PDF parsing or bulk embedding inside the chat route.

#### 4. Long-Running / Complex Workflows

n8n excels at visual multi-system automation. On Vercel, alternatives:

| Need | Solution |
|------|----------|
| Simple agent loop | Vercel AI SDK `ToolLoopAgent` |
| Long / resumable workflows | Inngest, Trigger.dev, Vercel Workflows |
| Scheduled KB sync | Vercel Cron + background job |
| Visual workflow editing | Not available — code + observability tools |

For chat + RAG + MCP + config, external orchestration is usually unnecessary.

#### 5. Other Serverless Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| Cold starts | First message slower | Fluid Compute, lean dependencies |
| No persistent memory | Agent state lost between invocations | Persist history in Supabase |
| DB connection pooling | Pool exhaustion in serverless | Supabase JS client / Supavisor |
| Concurrency billing | Multi-step agents hold functions longer | Monitor Function Duration usage |
| Edge vs Node runtime | Edge has limits on npm APIs | Use `runtime = 'nodejs'` for MCP, PDF |

#### 6. Capabilities Lost vs. n8n

| n8n provides | Node layer requires |
|--------------|---------------------|
| Visual workflow editor | TypeScript code orchestration |
| Non-dev workflow changes | Code change + deploy |
| 400+ integration nodes | Custom tools or direct API calls |
| Built-in execution history UI | Vercel Logs, Langfuse, Axiom |
| Native retry / branching | Inngest or manual retry logic |

Acceptable trade-off for a chat-first AI assistant platform.

---

## Comparative Analysis

| Dimension | Option A: n8n | Option B: Node + Vercel |
|-----------|---------------|-------------------------|
| Deployment complexity | ⚠️ Two systems (Vercel + n8n host) | ✅ Single Vercel deployment |
| Chat latency | ⚠️ Extra webhook hop | ✅ Direct |
| Streaming UX | ⚠️ Limited (no intermediate step streaming) | ✅ Full token streaming |
| Dynamic assistant config | ⚠️ Webhook payload + expressions | ✅ Natural per-request assembly |
| MCP multi-tenant | ⚠️ Static nodes, workarounds needed | ⚠️ Dynamic clients, HTTP only |
| Knowledge base RAG | ✅ Vector Store Tool | ✅ Custom tool + pgvector |
| Complex automation | ✅ Visual, 400+ integrations | ⚠️ Needs Inngest / similar |
| Non-developer workflow edits | ✅ Yes | ❌ No |
| Operational overhead | ⚠️ Higher | ✅ Lower |
| Type safety | ⚠️ Limited | ✅ End-to-end TypeScript |
| Fit for 7ai-club requirements | Moderate | **Strong** |

---

## Recommended Approach

**Primary recommendation: Option B — Node-layer orchestration with Vercel AI SDK.**

Rationale:

1. Product is **chat-first** with configurable assistants — not a general automation platform
2. Vercel + Supabase + AI SDK is the canonical stack for this use case
3. Lower latency and better streaming directly improve UX
4. Dynamic per-assistant configuration is simpler in code than in n8n workflows
5. Single deployment reduces ops burden for an early-stage project

**When to reconsider n8n (or add Inngest):**

- Complex multi-system automations (CRM sync, scheduled reports, approval flows)
- Non-technical team needs to modify conversation flows without deploys
- Integrations beyond what custom tools reasonably cover

**Hybrid pattern (future):**

```
Chat + RAG + MCP + Assistant config  →  Vercel AI SDK (Option B)
Complex background automation        →  Inngest or n8n (if needed later)
```

---

## Implementation Roadmap

### Phase 1 — MVP Chat

- [ ] Next.js project scaffold (App Router, Tailwind, shadcn/ui)
- [ ] Supabase Auth JWT + `@supabase/ssr`, middleware, basic schema (assistants, conversations, messages)
- [ ] Assistant CRUD admin (system prompt, model selection)
- [ ] `streamText` chat API route with streaming UI (`useChat`)
- [ ] Configure `maxDuration = 300`, `runtime = 'nodejs'`

### Phase 2 — Knowledge Base

- [ ] Supabase pgvector setup
- [ ] Document upload UI + Supabase Storage
- [ ] **Background job** for chunking + embedding (not in chat route)
- [ ] RAG retrieval tool in agent
- [ ] Assistant ↔ knowledge base binding

### Phase 3 — Agent + Tools

- [ ] Migrate to `ToolLoopAgent` with step limits
- [ ] Custom tools (database queries, external APIs)
- [ ] Conversation memory from Supabase history
- [ ] Observability (Langfuse or similar)

### Phase 4 — MCP

- [ ] `@ai-sdk/mcp` integration (HTTP/SSE only)
- [ ] Assistant ↔ MCP server binding in admin
- [ ] Encrypted credential storage
- [ ] MCP Gateway for production stability (optional)

### Phase 5 — Production Hardening

- [ ] Rate limiting, input validation
- [ ] Supabase RLS audit
- [ ] Error handling + graceful degradation when MCP/KB unavailable
- [ ] Cost monitoring (LLM tokens, Vercel function duration)

---

## Open Questions

1. **LLM provider:** OpenAI, Anthropic, or multi-provider from day one?
2. **Embedding model:** OpenAI `text-embedding-3-small` vs. open-source?
3. **MCP in MVP:** Support user-defined MCP URLs, or curated list only?
4. **Multi-tenancy:** Single workspace per user, or team/org model?
5. **Background jobs:** Inngest vs. Trigger.dev vs. Supabase Edge Functions for document ingestion?
6. **Observability:** Langfuse, Axiom, or Vercel-native logging sufficient for v1?

---

## References

- [Vercel AI SDK — Agents Overview](https://ai-sdk.dev/docs/agents/overview)
- [Vercel AI SDK — MCP Tools](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools)
- [Vercel AI SDK — Timeout Troubleshooting](https://ai-sdk.dev/docs/troubleshooting/timeout-on-vercel)
- [Vercel — Streaming Functions](https://vercel.com/docs/functions/streaming-functions)
- [n8n — AI Agents Documentation](https://docs.n8n.io/advanced-ai/agents/)
- [n8n — MCP Server Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcptrigger/)
- [Supabase — pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)

---

*Document maintained in `/docs/research/` — update as architecture decisions are finalized.*
