# iter-02 Changelog — mvp-chat

> **中文：** [iter-02-cn.md](./iter-02-cn.md)  
> **Iteration:** [iter-02/README.md](../../iterations/iter-02/README.md)

---

## 1. Topics

| Topic | PRD | Design |
|-------|-----|--------|
| Home + C2 + header user | [prd/landing.md](../prd/landing.md) | [design/landing.md](../design/landing.md) |
| Delete / clear / Markdown / sidebar & input UX | [prd/chat-experience.md](../prd/chat-experience.md) | [design/chat-experience.md](../design/chat-experience.md) |
| Bailian abort + errors | [prd/llm-reliability.md](../prd/llm-reliability.md) | [design/llm-reliability.md](../design/llm-reliability.md) |

---

## 2. Local Implementation Summary (2026-06-16)

See [iter-02-cn.md](./iter-02-cn.md) §2 for full detail (Landing, Chat UX, LLM, file list).

Highlights: public `/` landing, C2 tokens, compact user menu, delete/clear conversation APIs, bidirectional Markdown, sidebar cards (title + assistant + timestamp), floating send button, Thinking indicator, chunk timeout 60s, `enable_thinking: false` for Bailian.

---

## 3. Acceptance (iter-02)

- [x] AC-10 – AC-13, AC-18 (landing)
- [x] AC-14 – AC-17, AC-21 (chat) — code complete; manual QA
- [x] AC-19 – AC-20 (LLM) — code complete; **re-test Bailian streaming**

---

## 4. Design Status

All iter-02 module designs: **implemented (local)**. See [iter-02-cn.md](./iter-02-cn.md) §5 pre-ship checklist.

---

## 5. Revision History

| Date | Change |
|------|--------|
| 2026-06-15 | Created after PRD layering |
| 2026-06-16 | Local implementation wrap-up |
