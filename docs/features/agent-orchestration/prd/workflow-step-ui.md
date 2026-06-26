# Workflow step UI refactor

> **English:** [workflow-step-ui.md](./workflow-step-ui.md)  
> **中文:** [workflow-step-ui-cn.md](./workflow-step-ui-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-08  
> **Related:** [workflow-orchestration.md](./workflow-orchestration.md) · [history-summarization.md](./history-summarization.md)

---

## 1. Scope

| ID | Feature | Priority |
|----|---------|----------|
| F-63 | Default-collapsed step panel | P0 |
| F-64 | Summary detail as muted Markdown | P0 |
| F-65 | Reasoning streaming node | P1 |
| F-66 | Frontend component registry layering | P0 |
| F-67 | Dynamic node protocol (API-driven) | P0 |
| F-68 | Unified display for live / refresh / history | P0 |
| F-69 | API & DB step schema cleanup | P0 |

---

## 2. Background & goals

iter-06/07 introduced workflow orchestration and a 7-step node pipeline. The step UI lives inside `AssistantTurn`: steps **expand by default while running**, then collapse to “N steps completed”. Summary detail is plain text in `<pre>` after splitting on `\n\n`. Node order is hardcoded in `WORKFLOW_NODE_ORDER`; components live in a single file; live/completed/restore merge logic is scattered and error-prone.

**Goals:** default-collapsed panel with current-step header; Markdown muted summary; optional Reasoning stream node; registry-based frontend; API-driven node list; unified live/refresh/history behavior.

**Out of scope:** visual workflow editor; Preferences “Show reasoning” toggle; auto-expand Reasoning; backfilling old 4-step runs; new RAG/MCP/Skills nodes (registry slots only).

---

## 3. Confirmed product decisions (iter-08)

| Topic | Decision |
|-------|----------|
| Collapsed header | Current step label only (e.g. `Resolving model…`) |
| Skipped steps | Show in list as muted `skipped`; not used for header “current step” |
| Reasoning trigger | Auto from model capability; omit node if no content |
| Reasoning expand | Default collapsed; header shows `Reasoning…` while running |
| Reasoning persistence | Full text in `workflow_step_logs`; viewable in history |
| Old 4-step runs | No backfill |

---

## 4. Key requirements (summary)

### F-63 Default-collapsed panel

- Always show collapsible header when steps exist; **default collapsed** for both active and completed turns.
- Header shows **current running step label**; if none running, show completion summary (`N steps completed` or error count).
- English UI copy.

### F-64 Markdown summary detail

- Separate `summary` (headline) and `detail` (body); render detail as **muted Markdown** behind Show/Hide summary.

### F-65 Reasoning node

- Emit when model supports reasoning and content exists; stream in parallel with LLM reply; typewriter when expanded; persist full text for history.

### F-66–F-69

- Registry-based `components/chat/workflow/` structure; dynamic StepEvent fields (`kind`, `detailFormat`, `skipped` status); unified three-state display; API/DB schema extensions.

See [workflow-step-ui-cn.md](./workflow-step-ui-cn.md) for full Chinese spec, diagrams, and acceptance criteria.

---

## 5. Acceptance criteria

- [ ] **AC-80** — Steps panel default collapsed while running; header shows current running step + loading
- [ ] **AC-81** — After completion, panel default collapsed; header shows “N steps completed” or error count
- [ ] **AC-82** — User can expand/collapse full step list via header
- [ ] **AC-83** — Summary detail rendered as muted Markdown
- [ ] **AC-84** — Reasoning-capable models: Reasoning step streams; typewriter when expanded
- [ ] **AC-85** — Non-reasoning models: no Reasoning step
- [ ] **AC-86** — Mid-turn refresh: header reflects restored current step; stream continues
- [ ] **AC-87** — History: per-turn steps default collapsed; expanded matches DB
- [ ] **AC-88** — Skipped steps shown muted; not used for header current step
- [ ] **AC-89** — iter-06/07 workflow E2E regression pass

---

## 6. Revision history

| Date | Change |
|------|--------|
| 2026-06-26 | Initial — user confirmed recommended defaults |
