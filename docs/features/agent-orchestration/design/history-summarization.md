# Conversation history summarization — Technical design

> **English:** [history-summarization.md](./history-summarization.md)  
> **中文:** [history-summarization-cn.md](./history-summarization-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/history-summarization.md](../prd/history-summarization.md)  
> **Iteration:** iter-07

---

## 1. Design goals

**Option B (confirmed):** `evaluate_summarization` and `summarize_history` run **after** `llm_stream` completes (assistant persisted). `load_history_summary` stays **before** LLM so chat reads any existing summary.

Full diagrams, SQL, modules, node specs, UI, file list, tests, and risks: [history-summarization-cn.md](./history-summarization-cn.md).

---

## 2. Pipeline order

```
validate_request → load_context → load_history_summary → resolve_model → llm_stream
→ evaluate_summarization → summarize_history
```

Post-LLM nodes run inside `llm_stream` `onFinish` after `saveAssistantMessage`. Step SSE: **Generate response** first, then **Evaluating / Summarizing**.

---

## 3. LLM input (two states)

| Scenario | `llm_stream` reads |
|----------|-------------------|
| No prior summary | All non-archived messages |
| Summary exists | Memory in system + non-archived recent messages |

First threshold crossing: reply uses full non-archived history; summarize runs **after** that reply. From the **next message**, context is summary + retain window.

---

## 4. Failure semantics (Option B)

Chat reply is kept. `summarize_history` emits step `error`; do not roll back assistant. Run may still complete successfully for chat.

---

## 5. Revision history

| Date | Change |
|------|--------|
| 2026-06-25 | iter-07 draft |
| 2026-06-25 | **Option B** — post-LLM evaluate/summarize |
