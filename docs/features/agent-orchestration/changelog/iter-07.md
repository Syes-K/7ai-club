# iter-07 changelog — Conversation history summarization

> **English:** [iter-07.md](./iter-07.md)  
> **中文:** [iter-07-cn.md](./iter-07-cn.md)  
> **Iteration index:** [iter-07/README.md](../../iterations/iter-07/README.md)

---

## 1. Topics

| Topic | PRD | Design |
|-------|-----|--------|
| Rolling summary + workflow nodes + step expand | [prd/history-summarization.md](../prd/history-summarization.md) | [design/history-summarization.md](../design/history-summarization.md) |

**Related:** [console/changelog/iter-07.md](../../console/changelog/iter-07.md) · [mvp-chat/changelog/iter-07.md](../../mvp-chat/changelog/iter-07.md)

---

## 2. Required reading

See [iter-07-cn.md](./iter-07-cn.md) §2.

---

## 3. Planned / actual delivery

See [iter-07-cn.md](./iter-07-cn.md) §3 — includes follow-up migration `20260625230000_iter07_messages_update_workflow_user_message.sql`, workflow run matching, and post-LLM steps after `llm_stream` (not stream `onFinish`).

---

## 4. Product decisions (confirmed)

Soft archive; hybrid triggers; **Option B** (post-LLM evaluate/summarize); configurable summary model; inline expand; Clear chat removes memory. See [iter-07-cn.md](./iter-07-cn.md) §4.

---

## 5. Acceptance criteria

AC-70 through AC-77 — **checked** (qa-engineer, 2026-06-26). See [iter-07-cn.md](./iter-07-cn.md) §5.

---

## 6. Gates & phase status

| Phase | Status | Date |
|-------|--------|------|
| PRD | Confirmed | 2026-06-25 |
| Technical design | Confirmed | 2026-06-25 |
| Implementation | Delivered | 2026-06-25 |
| QA / release | **Released** | 2026-06-26 |

---

## 7–10. Manual QA, optimizations, metrics, known limits

Full tables (H-01–H-07 fixes, stick-to-bottom, step metric semantics, follow-ups): **[iter-07-cn.md](./iter-07-cn.md) §6–§10**.

---

## 11. Revision history

| Date | Change |
|------|--------|
| 2026-06-25 | Created iter-07 changelog — PRD confirmed |
| 2026-06-25 | Option B + turn atomicity synced to PRD/design |
| 2026-06-25 | Technical design confirmed; coding started |
| 2026-06-25 | §6–§10 — QA fixes, optimizations, metrics guide, known limits |
| 2026-06-26 | AC-70–77 checked; iteration **released** |
