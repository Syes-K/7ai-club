# Workflow step UI refactor — Technical design

> **English:** [workflow-step-ui.md](./workflow-step-ui.md)  
> **中文:** [workflow-step-ui-cn.md](./workflow-step-ui-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/workflow-step-ui.md](../prd/workflow-step-ui.md)  
> **Iteration:** iter-08

---

## 1. Goals

Default-collapsed step panel with current-step header; separated `summary`/`detail` with muted Markdown; optional Reasoning node bridged from AI SDK `reasoning` stream; frontend registry architecture; dynamic StepEvent protocol; unified live/refresh/history display; DB/API schema extensions.

Full specification, diagrams, migration SQL, and §12 AC mapping: **[workflow-step-ui-cn.md](./workflow-step-ui-cn.md)**.

---

## 2. Key technical decisions

| Area | Decision |
|------|----------|
| DB | Add `detail`, `detail_format`, `kind`, `sort_order`; extend `status` with `skipped` |
| Stream | New `data-workflow-step-delta` for reasoning chunks |
| Backend catalog | `lib/workflow/node-catalog.ts` — single source for `order`/`kind` |
| Reasoning | Conditional emit in `runLlmStreamNode`; `sendReasoning: false` on UI message stream to avoid duplicate body |
| Frontend | `components/chat/workflow/` registry; remove expanded-by-default in `AssistantTurn` |
| Sorting | `sortSteps()` by `order`/`startedAt`; drop `WORKFLOW_NODE_ORDER` for display |
| Skipped | `post-llm-memory` emits `status: skipped` instead of `success + Skipped` |

---

## 3. §12 AC mapping (summary)

| AC | Implementation | Verification |
|----|----------------|--------------|
| AC-80 | `WorkflowStepPanel` collapsed + running header | e2e, unit |
| AC-81 | Settled header with count/errors | e2e, unit |
| AC-82 | Header toggle expand | e2e |
| AC-83 | `SummaryDetailBlock` + muted Markdown | e2e, manual |
| AC-84 | Reasoning stream + `ReasoningStepRow` | manual, unit |
| AC-85 | No reasoning when unsupported | unit |
| AC-86 | REST restore + resume | e2e |
| AC-87 | History completed + collapsed | e2e |
| AC-88 | Skipped muted, excluded from header | unit, e2e |
| AC-89 | Full test regression | automated |

See [workflow-step-ui-cn.md §12](./workflow-step-ui-cn.md) for full mapping.

---

## 4. Revision history

| Date | Change |
|------|--------|
| 2026-06-26 | iter-08 technical design draft |
