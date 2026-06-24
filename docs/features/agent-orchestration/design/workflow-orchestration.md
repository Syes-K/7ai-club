# Workflow orchestration — Technical design

> **English:** [workflow-orchestration.md](./workflow-orchestration.md)  
> **中文:** [workflow-orchestration-cn.md](./workflow-orchestration-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/workflow-orchestration.md](../prd/workflow-orchestration.md)  
> **Iteration:** iter-06

---

## 1. Goals

- Refactor `app/api/chat/route.ts` to **WorkflowRunner** with observable linear nodes  
- Dual-write steps: SSE `data-workflow-step` + Supabase logs  
- Preserve iter-05 model resolution, streaming Markdown, message persistence  
- Extension slots for future RAG / MCP / Skills nodes (not implemented in iter-06)

---

## 2. Module layout

`lib/workflow/`: `types.ts`, `runner.ts`, `emit-step.ts`, `persistence.ts`, `nodes/*`.

Four nodes: `validate_request`, `load_context`, `resolve_model`, `llm_stream`.

Custom UI part: `data-workflow-step` with `WorkflowStepEvent` payload.

See [workflow-orchestration-cn.md](./workflow-orchestration-cn.md) for sequence diagram, SQL schema, RLS, POST flow, and UI components.

---

## 3. Key API changes

- `POST /api/chat` — `createUIMessageStream` + WorkflowRunner  
- `GET /api/chat/[conversationId]/workflow` — restore step timeline after refresh  
- Remove `req.signal` from LLM `abortSignal` (refresh must not cancel generation)

---

## 4. Revision history

| Date | Change |
|------|--------|
| 2026-06-24 | iter-06 technical design draft |
