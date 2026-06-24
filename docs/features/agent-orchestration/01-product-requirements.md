# Agent orchestration — Product requirements index

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文:** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `agent-orchestration`  
> **Iteration:** `iter-06` (see [iter-06 README](../../iterations/iter-06/README.md))  
> **Roadmap phase:** 2 — Agent orchestration foundation  
> **Status:** **PRD confirmed**  
> **PRD confirmed:** 2026-06-24  
> **Doc version:** v0.1

---

## 1. Executive summary

On top of MVP chat (iter-05), introduce an **extensible Workflow orchestration layer** (Vercel AI SDK; no LangChain / LangGraph / n8n): refactor `/api/chat` into an observable **node pipeline**, streaming each step’s **status / summary / error** to Chat in real time and persisting runs to Supabase for troubleshooting. Use **Upstash Redis** so streaming replies **resume after browser refresh**; **purge Redis keys for that run** after successful completion or on error. This iteration does **not** ship RAG, MCP, or Skills—only extension points for future nodes. **User-facing UI copy is English.**

---

## 2. Global conventions

### 2.1 Routes (no new pages)

| Path | Change |
|------|--------|
| `/chat/[conversationId]` | In-page step timeline UI |
| `POST /api/chat` | Refactored to WorkflowRunner (user-visible behavior equivalent) |
| `GET /api/chat` or resume route | New: resume active stream after refresh (path in technical design) |

### 2.2 Orchestration choices (product-level)

| Item | Choice |
|------|--------|
| Orchestration | Vercel AI SDK `createUIMessageStream` + custom WorkflowRunner |
| Not used | LangChain, LangGraph, n8n (chat path) |
| Stream resume store | **Upstash Redis** |
| Step / run logs | **Supabase Postgres** |
| LLM calls | Existing `lib/llm/provider.ts`, user model config (iter-05) |

### 2.3 Permissions

| Action | Who |
|--------|-----|
| View step timeline in own conversations | Conversation owner |
| View workflow run logs (DB) | Conversation owner (RLS) |
| Resume active stream | Conversation owner |

### 2.4 Out of scope (feature · iter-06)

- RAG retrieval nodes, knowledge base binding  
- MCP tool nodes  
- Skills mounting  
- LangChain / LangGraph / n8n  
- Visual workflow editor  
- LangSmith / third-party APM  
- Per-assistant workflow graphs  
- New Console pages  

### 2.5 Non-functional (summary)

| Type | Requirement |
|------|-------------|
| Performance | First step `running` event to client < 500ms (normal network) |
| Security | RLS on runs / steps; summaries must not include API keys |
| Deploy | Single Vercel; chat `maxDuration` unchanged |
| Redis | Upstash; **delete run Redis keys after success or error** |
| Locale | User-facing UI **English** |

### 2.6 Feature index

| ID | Feature | PRD | Iteration |
|----|---------|-----|-----------|
| F-50 | Workflow orchestration & node pipeline | [prd/workflow-orchestration.md](./prd/workflow-orchestration.md) | iter-06 |
| F-51 | Step timeline UI | [prd/workflow-orchestration.md](./prd/workflow-orchestration.md) | iter-06 |
| F-52 | Run logs (runs + step logs) | [prd/workflow-orchestration.md](./prd/workflow-orchestration.md) | iter-06 |
| F-53 | Stream resume (Upstash + resume) | [prd/stream-resume.md](./prd/stream-resume.md) | iter-06 |

---

## 3. Document map

See [01-product-requirements-cn.md](./01-product-requirements-cn.md) §3 for the Chinese index structure.

---

## 4. Revision history

| Date | Version | Change |
|------|---------|--------|
| 2026-06-24 | v0.1 | iter-06 initial — PRD confirmed |

---

*Next: `02-technical-design.md` (fullstack-developer)*
