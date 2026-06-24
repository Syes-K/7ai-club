# iter-06 changelog — Chat API orchestration refactor

> **English:** [iter-06.md](./iter-06.md)  
> **中文:** [iter-06-cn.md](./iter-06-cn.md)  
> **Iteration index:** [iter-06/README.md](../../iterations/iter-06/README.md)

---

## 1. Theme

This iteration adds **no new chat product features**; `/api/chat` and Chat UI are refactored by [agent-orchestration](../../agent-orchestration/changelog/iter-06.md).

| Area | Notes |
|------|-------|
| `POST /api/chat` | WorkflowRunner replaces linear `streamText` call chain |
| Chat UI | Step timeline (incremental); workflow embedded in single `AssistantTurn` bubble |
| Resume | Conditional `resumeStream` in `chat-conversation-panel` (see agent-orchestration §4.3) |
| User-visible behavior | iter-05 model, streaming, persistence **unchanged in intent** — AC-54 regression verified |

---

## 2. Required reading

1. [agent-orchestration/changelog/iter-06.md](../../agent-orchestration/changelog/iter-06.md)  
2. [prd/chat-model-config.md](../prd/chat-model-config.md) — model resolution rules unchanged  

---

## 3. Implementation touchpoints (mvp-chat view)

| File | Change |
|------|--------|
| `app/api/chat/route.ts` | Entry point → workflow + resumable stream |
| `components/chat/chat-conversation-panel.tsx` | `useTurnWorkflow` + conditional resume |
| `components/chat/chat-messages.tsx` | Turn-bound step rendering |
| `components/chat/assistant-turn.tsx` | New: assistant bubble + steps + body text |
| `lib/chat/conversations.ts` | Assistant persist supports UUID `message.id` |

Cross-cutting details: agent-orchestration changelog §3–§5.

---

## 4. Acceptance (regression)

- [x] **AC-54** — E2E iter-04/05/06 suite pass (see agent-orchestration changelog §8)

---

## 5. Revision history

| Date | Change |
|------|--------|
| 2026-06-24 | Created mvp-chat iter-06 cross-reference |
| 2026-06-24 | §3 implementation touchpoints; resume/UI aligned with agent-orchestration calibrations |
| 2026-06-24 | QA: AC-54 checked |
| 2026-06-24 | Release prep: aligned with agent-orchestration docs |
| 2026-06-24 | iter-06 **released** |
