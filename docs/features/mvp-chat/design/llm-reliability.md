# LLM Reliability — Technical Design

> **English:** [llm-reliability.md](./llm-reliability.md)  
> **中文：** [llm-reliability-cn.md](./llm-reliability-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/llm-reliability.md](../prd/llm-reliability.md)  
> **Iteration:** iter-02  
> **Status:** Draft  
> **Version:** v0.1

---

## 1. Goals

Fix Bailian `qwen3.6-plus` streaming abort; clearer error messages.

**Fix:** `CHAT_CHUNK_TIMEOUT_MS` 60s (configurable via `LLM_CHUNK_TIMEOUT_MS`); `enable_thinking: false` for bailian via `providerOptions`.

Full detail: [llm-reliability-cn.md](./llm-reliability-cn.md).

---

## 5. Files

`lib/llm/timeout.ts`, `lib/llm/stream-options.ts`, `lib/llm/errors.ts`, `app/api/chat/route.ts`, `lib/chat/fetch-with-error.ts`

---

## 9. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-06-15 | v0.1 | iter-02 initial |
