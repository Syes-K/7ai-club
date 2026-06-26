# iter-08 changelog — Workflow step UI refactor

> **English:** [iter-08.md](./iter-08.md)  
> **中文:** [iter-08-cn.md](./iter-08-cn.md)  
> **Iteration index:** [iter-08/README.md](../../iterations/iter-08/README.md)

---

## 1. Theme

| Topic | PRD | Design |
|-------|-----|--------|
| Workflow step UI refactor | [prd/workflow-step-ui.md](../prd/workflow-step-ui.md) | [design/workflow-step-ui.md](../design/workflow-step-ui.md) (Phase A) |

---

## 2. Must read

1. [01-product-requirements.md](../01-product-requirements.md)  
2. [prd/workflow-step-ui.md](../prd/workflow-step-ui.md) — F-63–F-69 · AC-80–89  
3. [prd/workflow-orchestration.md](../prd/workflow-orchestration.md) — iter-06 baseline  

---

## 5. Acceptance checklist

- [x] **AC-80** — Default collapsed while running; header shows current step + loading
- [x] **AC-81** — Default collapsed when complete; header shows step count or errors
- [x] **AC-82** — Expand/collapse via header
- [x] **AC-83** — Muted Markdown summary detail (user manual QA)
- [x] **AC-84** — Reasoning stream + typewriter when expanded
- [x] **AC-85** — No Reasoning step for non-reasoning models
- [x] **AC-86** — Mid-turn refresh restores header and stream
- [x] **AC-87** — History turns default collapsed; expanded matches DB
- [x] **AC-88** — Skipped steps muted; not in header
- [x] **AC-89** — iter-06/07 workflow E2E regression

See [iter-08-cn.md](./iter-08-cn.md) for full Chinese changelog, decisions, and QA sections.

---

## 6. Gate status

| Phase | Status | Date |
|-------|--------|------|
| PRD | Confirmed | 2026-06-26 |
| Phase B | Delivered | 2026-06-26 |
| QA C0–C4 | AC-80–89 signed off | 2026-06-26 |
| **Released** | User confirmed iteration complete | 2026-06-26 |

---

## 7. Manual verification fixes (summary)

| ID | Issue | Fix |
|----|-------|-----|
| H-01 | History missing workflow; `detail` column error | Remote migration + PostgREST reload; persistence legacy fallback |
| H-02 | Workflow not restored after new messages | Reload workflow on user message count change |
| H-03 | Collapsed header not obviously clickable | Chevron + `aria-label` on header |
| H-04 | Model Test fails for `deepseek-v4-pro` | Direct HTTP connectivity probe; disable thinking per provider |
| H-05 | No Reasoning step for Qwen3 / DeepSeek V4 | `openai-compatible` client; fix provider options key; capability whitelist |
| H-06 | Reasoning panel no auto-scroll when expanded | Scroll-to-end while streaming |
| B-04 | Inline step expand layout | Label + chevron on one line; Summarizing stats inside fold |

Full Chinese details: [iter-08-cn.md §7–§9](./iter-08-cn.md).

---

## 13. Revision history

| Date | Change |
|------|--------|
| 2026-06-26 | Created iter-08 changelog — PRD confirmed |
| 2026-06-26 | qa C0: §5.1 Test Matrix + §12 in iter-08-cn |
| 2026-06-26 | QA C4 AC-80–89; pre-release UX B-04; **Released** |
