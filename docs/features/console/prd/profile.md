# Profile

> **English:** [profile.md](./profile.md)  
> **中文:** [profile-cn.md](./profile-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-03 (base) · **iter-05 (Preferences refactor)**

---

## 1. Scope

F-21 — `/console/profile`: Account info + Preferences (preferred chat model).

- **iter-03:** Read-only email, nickName, static model dropdown from env `LLM_PROVIDER`
- **iter-05:** Dual cards, Detail/Edit modes, Preferences limited to **Passed** Models configs

---

## 2. User Stories


| ID    | Story                                                                      | Priority | Iteration |
| ----- | -------------------------------------------------------------------------- | -------- | --------- |
| US-20 | As a signed-in user, I want to set a nickName shown across the app         | P0       | iter-03   |
| US-21 | As a signed-in user, I want to pick my preferred chat model                | P0       | iter-03   |
| US-33 | As a user, I pick my default chat model from tested configs in Preferences | P0       | iter-05   |
| US-34 | As a user, Account and Preferences save independently                      | P0       | iter-05   |
| US-35 | As a user, Profile opens in detail view; Edit enters form mode             | P1       | iter-05   |
| US-36 | As a user, I configure conversation summarization and summary model in Preferences | P0 | iter-07 |


---

## 3. F-21 Profile

### 3.1 Page Structure (iter-05)

Two vertical **Cards** (English UI):

```
┌─ Account ──────────────────────────────┐
│  View: email, nickname                 │
│  [Edit] → form → [Save] / [Cancel]     │
└────────────────────────────────────────┘

┌─ Preferences ──────────────────────────┐
│  View: current provider + model label  │
│  [Edit] → dropdown → [Save] / [Cancel] │
└────────────────────────────────────────┘
```

- Default: **View (Detail)** mode
- Each card has independent Edit / Save / Cancel
- Success: inline **Saved.** or toast (same as iter-03)

### 3.2 Account Card


| Field    | Editable        | Source                   |
| -------- | --------------- | ------------------------ |
| Email    | No              | Supabase Auth            |
| Nickname | Yes (Edit mode) | `user_profiles.nickname` |


**Nickname display (iter-03, unchanged):** Header + UserMenu on Chat/Console when set; Landing uses compact menu only.

**Validation:** Nickname max 32 chars; trim; empty clears nickname.

### 3.3 Preferences Card (iter-05)


| Field           | Editable        | Source                                                         |
| --------------- | --------------- | -------------------------------------------------------------- |
| Preferred model | Yes (Edit mode) | Reference to **Passed** Models config (incl. platform default) |


**View mode (English):** `{Provider label} — {model name}`

**Edit mode dropdown:**

- Options: only user configs with `test_status = Passed`
- Format: `{Provider label} — {model name}`
- Includes platform default Bailian qwen3.6-plus
- No Passed configs: empty state + link to `/console/models`

**Save:** Persists selected config reference; applies to Chat LLM calls (not per-assistant model column).

### 3.4 Conversation memory (iter-07)

Add a **Conversation memory** section inside the Preferences card (English UI). Same card as chat model; **independent Save** (iter-05 pattern).

| Field | Edit control | Default |
|-------|--------------|---------|
| Enable summarization | Toggle | On |
| Trigger turn count | Number | 20 |
| Retain turn count | Number | 4 |
| Trigger token count | Number | 8000 |
| Retain token count | Number | 2000 |
| Summary model | Dropdown | Same as chat model (+ Passed configs) |

**Validation:** `retain_turns ≤ trigger_turns`; `retain_tokens ≤ trigger_tokens`; numeric fields disabled when toggle Off.

See [agent-orchestration/prd/history-summarization.md](../../agent-orchestration/prd/history-summarization.md).

### 3.5 iter-03 vs iter-05


| iter-03                      | iter-05                         |
| ---------------------------- | ------------------------------- |
| Single form, one Save        | Dual cards, independent Save    |
| Always form mode             | Default Detail, Edit to form    |
| Static modelOptions from env | Passed configs from Models page |


---

## 4. Acceptance Criteria

### iter-03 (delivered)

- [x] **AC-04** — Email read-only; nickName in header/UserMenu
- [x] **AC-05** — Model preference saved (iter-03 static list; iter-05 superseded by AC-43/46)

### iter-05

- [x] **AC-43** — Preferences dropdown lists Passed configs only (incl. platform default)
- [x] **AC-44** — Account and Preferences save independently
- [x] **AC-45** — Default Detail view; Edit/Cancel behavior

### iter-07

- [ ] **AC-70** — Conversation memory fields editable, validated, persisted (see agent-orchestration changelog)

---

## 5. Revision History


| Date       | Change                                                           |
| ---------- | ---------------------------------------------------------------- |
| 2026-06-16 | iter-03 initial                                                  |
| 2026-06-16 | Delivered iter-03                                                |
| 2026-06-17 | iter-05 — dual cards, Preferences bound to Models Passed configs |
| 2026-06-25 | iter-07 — Conversation memory summarization settings in Preferences |


