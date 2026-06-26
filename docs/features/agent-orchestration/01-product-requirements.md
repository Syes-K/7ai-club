# Agent orchestration — Product requirements index

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文:** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `agent-orchestration`  
> **Iteration:** `iter-06` (released) · `iter-07` (released) · **`iter-08` (in progress)** — see [iter-08 README](../../iterations/iter-08/README.md)  
> **Roadmap phase:** 2 — Agent orchestration foundation  
> **Status:** **PRD confirmed** (iter-06 + iter-07 + iter-08) · iter-07 **released** (2026-06-26)  
> **PRD confirmed:** iter-06 · 2026-06-24 · iter-07 · 2026-06-25 · iter-08 · 2026-06-26  
> **Doc version:** v0.3

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
| F-60 | Conversation rolling summary | [prd/history-summarization.md](./prd/history-summarization.md) | iter-07 |
| F-61 | Summary workflow nodes | [prd/history-summarization.md](./prd/history-summarization.md) | iter-07 |
| F-62 | Inline step expand for summary | [prd/history-summarization.md](./prd/history-summarization.md) | iter-07 |
| F-63 | Default-collapsed step panel | [prd/workflow-step-ui.md](./prd/workflow-step-ui.md) | iter-08 |
| F-64 | Muted Markdown summary detail | [prd/workflow-step-ui.md](./prd/workflow-step-ui.md) | iter-08 |
| F-65 | Reasoning streaming node | [prd/workflow-step-ui.md](./prd/workflow-step-ui.md) | iter-08 |
| F-66 | Frontend component registry | [prd/workflow-step-ui.md](./prd/workflow-step-ui.md) | iter-08 |
| F-67 | Dynamic node protocol | [prd/workflow-step-ui.md](./prd/workflow-step-ui.md) | iter-08 |
| F-68 | Unified live / refresh / history display | [prd/workflow-step-ui.md](./prd/workflow-step-ui.md) | iter-08 |
| F-69 | API & DB step schema cleanup | [prd/workflow-step-ui.md](./prd/workflow-step-ui.md) | iter-08 |

---

## 3. Document map

See [01-product-requirements-cn.md](./01-product-requirements-cn.md) §3 for the Chinese index structure.

---

## 4. Revision history

| Date | Version | Change |
|------|---------|--------|
| 2026-06-24 | v0.1 | iter-06 initial — PRD confirmed |
| 2026-06-25 | v0.2 | iter-07 — history summarization PRD confirmed |
| 2026-06-25 | v0.3 | iter-07 implemented; see [changelog/iter-07-cn.md](./changelog/iter-07-cn.md) §6–§10 |
| 2026-06-26 | v0.4 | iter-08 — workflow step UI refactor PRD confirmed |

---

*Next: `02-technical-design.md` (fullstack-developer)*
