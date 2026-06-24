# Workflow orchestration & step visibility

> **English:** [workflow-orchestration.md](./workflow-orchestration.md)  
> **中文:** [workflow-orchestration-cn.md](./workflow-orchestration-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-06  
> **Related:** [stream-resume.md](./stream-resume.md) · [mvp-chat/prd/chat-model-config.md](../../mvp-chat/prd/chat-model-config.md)

---

## 1. Scope

F-50 — WorkflowRunner and node pipeline; refactor `POST /api/chat`.  
F-51 — In-chat step timeline (real-time updates).  
F-52 — Supabase run logs (`workflow_runs`, `workflow_step_logs`).

---

## 2. User stories

| ID | Story | Priority |
|----|-------|----------|
| US-50 | As a user, after sending a message I see which steps are running (load context, resolve model, generate reply) | P0 |
| US-51 | As a user, each step updates while it runs, not only after the full turn completes | P0 |
| US-52 | As a user, when a step fails I see a clear error instead of a blank or stuck UI | P0 |
| US-53 | As a user, after refresh I still see completed steps for the current run | P0 |
| US-54 | As a developer/operator, I can query per-run step status and duration in the DB | P1 |

---

## 3. F-50 Workflow orchestration

### 3.1 Background

iter-05 `/api/chat` is linear: auth → load config → `streamText`. Future RAG, MCP, and Skills need an extensible, observable orchestration layer. This iteration ships the **skeleton** only.

### 3.2 Principles

| Principle | Description |
|-----------|-------------|
| Stack | Vercel AI SDK; **no** LangChain / LangGraph / n8n |
| Nodes | Each step is a node with `id`, English `label`, `run()` |
| Order | iter-06 **fixed linear** pipeline (code-configured) |
| On failure | **Any node failure aborts the run** with user-readable error |
| Extension | Slots for `rag_retrieve`, `mcp_tools`, `skills` (not implemented in iter-06) |
| LLM | iter-05 user model resolution + `streamText` |

### 3.3 iter-06 nodes (initial)

| Node ID | Label (English) | Responsibility |
|---------|-----------------|----------------|
| `validate_request` | Validating request | Auth, params, non-empty message |
| `load_context` | Loading conversation | conversation, history, assistant |
| `resolve_model` | Resolving model | Profile model / platform default |
| `llm_stream` | Generating response | Stream LLM; persist assistant message |

Technical design may merge/split nodes; user-visible steps must match the four semantics above.

### 3.4 Step events

Each node emits structured events (AI SDK custom data part, e.g. `data-workflow-step`) with `runId`, `nodeId`, `label`, `status` (`running` \| `success` \| `error`), optional `summary` / `error`, timestamps.

- Emit `running` on entry  
- Emit `success` on completion  
- Emit `error` and stop pipeline on failure  
- LLM tokens stream in parallel with step events  

### 3.5 Parity with iter-05

User model, assistant prompt, streaming Markdown, failed/untested model rejection, and message persistence behave as in iter-05.

---

## 4. F-51 Step timeline UI

- **Page:** `/chat/[conversationId]`  
- **Audience:** all signed-in users (not debug-only)  
- **Copy:** English only  
- See Chinese PRD §4 for UI state table and refresh behavior.

---

## 5. F-52 Run logs (Supabase)

Concept tables `workflow_runs` and `workflow_step_logs`; RLS by owner; server writes; see Chinese PRD §5 for field list.

---

## 6. Acceptance criteria

- [x] **AC-50** — ≥4 English steps shown after send  
- [x] **AC-51** — `running` visible within 500ms of node start  
- [x] **AC-52** — Step failure shows error; later nodes skipped  
- [x] **AC-53** — DB rows with RLS  
- [x] **AC-54** — iter-05 chat regression passes  
- [x] **AC-55** — Completed steps restored after refresh  

---

## 7. Revision history

| Date | Change |
|------|--------|
| 2026-06-24 | iter-06 initial — PRD confirmed |
| 2026-06-24 | AC-50–55 verified; synced with changelog §6 |
