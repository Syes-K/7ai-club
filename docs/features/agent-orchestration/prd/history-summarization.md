# Conversation history summarization

> **English:** [history-summarization.md](./history-summarization.md)  
> **中文:** [history-summarization-cn.md](./history-summarization-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-07  
> **Related:** [console/prd/profile.md](../../console/prd/profile.md) · [workflow-orchestration.md](./workflow-orchestration.md) · [mvp-chat/prd/chat-experience.md](../../mvp-chat/prd/chat-experience.md)

---

## 1. Scope

F-60 — Per-conversation **rolling summary**: compress early messages when thresholds are exceeded; keep recent turns intact for LLM context.  
F-61 — Independent workflow nodes: `load_history_summary`, `evaluate_summarization`, `summarize_history`.  
F-62 — **Inline collapse/expand** for summary details in the step timeline (English).

---

## 2. User stories

| ID | Story | Priority |
|----|-------|----------|
| US-60 | As a user, I want long chats to retain early context so I can continue deep discussions | P0 |
| US-61 | As a user, I can enable/disable summarization and tune trigger/retain thresholds in Preferences | P0 |
| US-62 | As a user, I can pick a summary model; if unset, use the chat model | P1 |
| US-63 | As a user, clearing chat also clears the memory summary | P0 |
| US-64 | As a user, I can expand workflow steps to read summary details | P0 |

---

## 3. Background

iter-06 `load_context` sends **all** `messages` to the LLM. Long conversations hit context limits, add latency/cost, and truncate early detail unpredictably.

This iteration adds an **observable** summarization pipeline in the workflow, user-level policy in Preferences, and **no** “Memory updated” system bubble in the chat stream.

---

## 4. Terminology

| Term | Definition |
|------|------------|
| **Turn** | Industry default: **one user message + one assistant message** = 1 turn; trailing user-only (no assistant yet) **does not** count |
| **Rolling summary** | One cumulative summary row per conversation; later runs **merge/update** it |
| **Soft archive** | Summarized messages **remain in DB** but are **excluded from LLM context**; hard-deleted on Clear chat |
| **Estimated tokens** | Server-side estimate for messages + summary (technical design defines algorithm; must match trigger/retain logic) |

---

## 5. F-60 Summarization policy

### 5.1 Preferences (user-level · English UI)

See [console/prd/profile.md](../../console/prd/profile.md) §3.4 iter-07.

| Parameter | UI label (English) | Type | Description |
|-----------|-------------------|------|-------------|
| Enable summarization | Enable conversation memory summarization | Toggle | Off skips evaluate / summarize |
| Trigger turn count | Trigger when turns exceed | Number (int ≥ 1) | One of OR trigger conditions |
| Retain turn count | Retain recent turns | Number (int ≥ 0) | Full recent turns kept after summarization |
| Trigger token count | Trigger when estimated tokens exceed | Number (int ≥ 1) | One of OR trigger conditions |
| Retain token count | Retain up to tokens | Number (int ≥ 1) | Target cap for summary + recent window |
| Summary model | Summary model | Dropdown (optional) | Passed configs only; default **Same as chat model** |

**Validation on Save:**

- `retain_turns ≤ trigger_turns`
- `retain_tokens ≤ trigger_tokens`
- When toggle Off, other fields read-only/disabled; Save still persists toggle

### 5.2 System defaults

Values used when the user has **never customized** summarization settings:

| Parameter | Default | Notes |
|-----------|---------|-------|
| Enable summarization | **On** | |
| Trigger turn count | **20** | ~20 complete turns before possible trigger |
| Retain turn count | **4** | Keep last 4 full turns verbatim |
| Trigger token count | **8000** | |
| Retain token count | **2000** | Target context size after compression |
| Summary model | **Same as chat model** | |

### 5.3 Trigger & retain (hybrid · confirmed)

**Evaluation timing (Option B · confirmed):** `evaluate_summarization` and `summarize_history` run **after** `llm_stream` finishes and the **assistant message is persisted**. Evaluation includes the **complete user+assistant pair** for this turn.

**Trigger (OR)** when Enable = On and **either**:

```
complete_turns > trigger_turns
OR estimated_context_tokens > trigger_tokens
```

`estimated_context_tokens` = rolling summary (if any) + all non-archived messages (**including the assistant just saved**).

**LLM input during `llm_stream` (before evaluate/summarize):**

| State | Chat LLM reads |
|-------|----------------|
| **No rolling summary yet** | All non-archived messages (incl. current user; assistant not saved until stream ends) |
| **Summary already exists** | Rolling summary (in system) + non-archived recent messages |

> **Note:** On the **first** threshold crossing, the reply uses full non-archived history because no summary exists yet; **summarization runs after that reply**. From the **next message onward**, context is summary + retain window. Steady-state turns do **not** re-send archived messages verbatim.

**Retain (AND):**

1. Always keep the last `retain_turns` **complete** user+assistant turns (including this turn) out of the archive batch  
2. Merge older non-archived messages into the rolling summary  
3. **Subsequent** LLM input = `[system_prompt + rolling_summary]` + `[recent_messages]`; total estimate approaches `retain_tokens`

**Skip:** Below thresholds → `summarize_history` success with summary `Skipped`.

### 5.3.1 Turn atomicity (confirmed)

**Whether triggered by turn count or tokens, the minimum unit for archive and retain is always one complete turn (1 user + 1 assistant).** Never split mid-turn by token, and never archive only user or only assistant from the same turn.

| Rule | Detail |
|------|--------|
| **Archive batch** | Only **complete** historical turns; oldest complete turns first, merged into rolling summary and soft-archived as whole turns |
| **Retain window** | Last `retain_turns` **complete** turns (including this turn’s user+assistant), kept verbatim as whole turns |
| **Token trigger** | Tokens decide **whether** to summarize; they do **not** split individual messages mid-turn |
| **retain_tokens** | After keeping `retain_turns` complete turns, if estimate still exceeds `retain_tokens`, move **oldest retained complete turns** one at a time into the archive batch until under target or only 1 turn remains |
| **Boundary turn** | A turn on the retain/archive boundary belongs **entirely** to one side — fully kept or fully archived |

**Token estimate for evaluate:** may sum per-message tokens for threshold comparison; **summarize execution** still aligns archive/retain decisions to **whole turns**.

### 5.4 Summary LLM

| Rule | Detail |
|------|--------|
| Selection | Preferences **Summary model**; includes `Same as chat model` + Passed user configs |
| Fallback | Unset or Same as chat → use this turn’s **resolved chat model** from `resolve_model` |
| Optional dedicated model | User may pick a cheaper Passed model for summarization only |
| Failure | Chat reply **already delivered and kept**; `summarize_history` emits `error`; **do not** roll back assistant message; next turn uses uncompressed context until summarize succeeds |

### 5.5 Soft archive

| Item | Rule |
|------|------|
| Scope | Messages merged into rolling summary |
| DB | Rows kept; `summarized_at` or equivalent (technical design) |
| LLM | Excluded from context assembly |
| Chat UI | **Still visible** in message list |
| Clear chat | Hard-delete messages + summary + archive markers |

### 5.6 Rolling summary content

- English structured bullets for the LLM  
- Preserve goals, decisions, facts, open questions, proper nouns  
- Must not include API keys or secrets  
- Merge prior summary + newly archived messages (not one-line append only)

---

## 6. F-61 Workflow nodes (Option B)

**Pipeline order (fixed):**

```
validate_request → load_context → load_history_summary → resolve_model → llm_stream
→ evaluate_summarization → summarize_history
```

| Node ID | When | Label (English) | Responsibility |
|---------|------|-----------------|----------------|
| `load_history_summary` | Before LLM | Loading memory summary | Load rolling summary for **this turn’s** chat context |
| `resolve_model` | Before LLM | Resolving model | Unchanged from iter-06 |
| `llm_stream` | — | Generating response | Stream reply using **existing summary + non-archived messages**; persist assistant |
| `evaluate_summarization` | After LLM | Evaluating context size | Turns/tokens on messages **including new assistant**; no LLM |
| `summarize_history` | After LLM | Summarizing history | Conditional summarize + soft-archive, or `Skipped` |

Enable Off → evaluate `Summarization disabled`; summarize `Skipped`. Step SSE: **Generate response** first (streaming), then **Evaluating / Summarizing**.

---

## 7. F-62 Step UI — inline expand (P0)

Extend iter-06 `WorkflowStepSummary`; **not** Modal/Drawer by default.

- Collapsed: label + truncated preview (≤ 80 chars)  
- Expanded: full summary + metadata; `max-h-48 overflow-y-auto`  
- No “Memory updated” chat bubble

---

## 8. F-63 Clear chat extension

Extends [mvp-chat/prd/chat-experience.md](../../mvp-chat/prd/chat-experience.md) F-14:

- Delete memory summary with messages  
- English confirm: «Clear chat history? All messages **and conversation memory** will be removed. This cannot be undone.»  
- Delete conversation (F-12) cascades summary cleanup

---

## 9. Acceptance criteria

- [x] **AC-70** — Preferences: 5 summarization fields + Summary model; Save persists; invalid combos rejected (English errors)
- [x] **AC-71** — Enable Off skips summarize path; chat equivalent to iter-06
- [x] **AC-72** — Over threshold: summarize after assistant saved; summary in DB; **from next message** archived rows excluded from LLM; first trigger turn may answer with full non-archived history when no prior summary  
- [x] **AC-73** — Under threshold: post-LLM evaluate + summarize show `Skipped`  
- [x] **AC-74** — Clear chat removes messages + memory; updated confirm copy
- [x] **AC-75** — Step timeline expand/collapse for summary details (English)
- [x] **AC-76** — Summary model falls back to chat model when unset
- [x] **AC-77** — iter-05/06 regression passes

---

## 10. Out of scope (iter-07)

Per-assistant policies, summary version history UI, summary as chat message, RAG/MCP, auto-deleting archived rows from DB.

---

## 11. Dependencies

iter-06 workflow, iter-05 Preferences/Models, iter-02 Clear chat.

---

## 12. Revision history

| Date | Change |
|------|--------|
| 2026-06-25 | iter-07 initial — user confirmed soft archive, turn definition, configurable summary model, inline expand |
| 2026-06-25 | **Option B** — evaluate + summarize after `llm_stream`; clarify first trigger vs existing summary LLM input |
| 2026-06-25 | **Turn atomicity** — archive/retain minimum unit is always a complete turn under hybrid trigger |
