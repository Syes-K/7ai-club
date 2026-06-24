# Chat Model Display & Routing

> **English:** [chat-model-config.md](./chat-model-config.md)  
> **中文:** [chat-model-config-cn.md](./chat-model-config-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-05  
> **Related Console PRDs:** [console/prd/models.md](../../console/prd/models.md) · [console/prd/profile.md](../../console/prd/profile.md)

---

## 1. Scope

F-15 — Chat UI shows provider + model from Profile Preferences; `POST /api/chat` uses the matching tested config and key.

---

## 2. User Stories


| ID    | Story                                                           | Priority |
| ----- | --------------------------------------------------------------- | -------- |
| US-35 | As a user, I see the active provider and model in Chat          | P0       |
| US-21 | As a user, chat LLM calls use my Profile-selected, tested model | P0       |


---

## 3. F-15 Chat Model Integration

### 3.1 Display (modelLabel)

**Location:** Chat header / session area (same as iter-03/04 — `ConversationSession.modelLabel` or equivalent).

**Rules (iter-05):**


| Item                                            | Rule                                               |
| ----------------------------------------------- | -------------------------------------------------- |
| Source                                          | Profile Preferences → **Passed** user model config |
| Format (English)                                | `{model name} ({provider})`                        |
| Example                                         | `qwen3.6-plus (bailian)`                           |
| No preference set                               | Fall back to platform default Bailian qwen3.6-plus |
| env `LLM_PROVIDER` / `NEXT_PUBLIC_LLM_PROVIDER` | **No longer** drives Chat display                  |


After Preferences change: refresh or layout injection updates label; new messages use new config.

### 3.2 LLM Call (`/api/chat`)

**Resolution (iter-05):**

1. Profile Preferences → user model config ID (Passed)
2. No valid preference → platform default Bailian qwen3.6-plus
3. Resolve provider + model name + API key (user decrypt vs env `BAILIAN_API_KEY`)

**Blocked:** Untested / Failed configs (server-side validation).

**Unavailable:** No Passed config and no platform key → 503 + English message, link to `/console/models`.

**Unchanged:** Assistant `system_prompt` from selected assistant; no per-assistant model picker.

### 3.3 iter-04 vs iter-05


| iter-04                                 | iter-05                           |
| --------------------------------------- | --------------------------------- |
| `preferred_model` string + env provider | Full user model config            |
| `NEXT_PUBLIC_LLM_PROVIDER` for label    | Label from Preferences config     |
| Global env API key                      | Per-config key + platform env key |


---

## 4. Acceptance Criteria

- [x] **AC-46** — Chat modelLabel matches Profile Preferences
- [x] **AC-47** — Chat uses user key; platform default uses env `BAILIAN_API_KEY`
- [x] **AC-48** — Untested/Failed configs rejected server-side

---

## 5. Dependencies

- [console/prd/models.md](../../console/prd/models.md)
- [console/prd/profile.md](../../console/prd/profile.md)
- iter-04 layout injection and browser session `modelLabel`

---

## 6. Revision History


| Date       | Change                          |
| ---------- | ------------------------------- |
| 2026-06-17 | iter-05 initial — PRD confirmed |


