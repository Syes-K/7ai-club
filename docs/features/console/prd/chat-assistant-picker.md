# New Chat Assistant Picker

> **English:** [chat-assistant-picker.md](./chat-assistant-picker.md)  
> **中文：** [chat-assistant-picker-cn.md](./chat-assistant-picker-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-03

---

## 1. Scope

F-23 — Changing **New Chat** to require assistant selection before creating a conversation.

---

## 2. User Story

| ID | Story | Priority |
|----|-------|----------|
| US-24 | As a user, I want to pick an assistant when starting a new chat so that the conversation uses the right persona | P0 |

---

## 3. F-23 Flow

1. User clicks **New chat** (sidebar or empty state)
2. **Modal / dialog** opens listing user's assistants (Name)
3. User **must select** one assistant (no default skip)
4. **Create** → `POST /api/conversations` with `assistantId` → navigate to `/chat/[id]`
5. Conversation uses selected assistant's `system_prompt`; LLM model from Profile preference

### 3.1 Zero assistants

- Run seed (see [assistants.md](./assistants.md) §3.4), then show picker with one row
- If seed fails, show error with link to Console

### 3.2 Existing conversations

- Unchanged: still bound to original `assistant_id` (including legacy global assistant)

---

## 4. Acceptance Criteria

- [ ] **AC-09** — New Chat opens picker; cannot create without selection
- [ ] **AC-10** — New chat uses selected system prompt + Profile model preference

---

## 5. Revision History

| Date | Change |
|------|--------|
| 2026-06-16 | Initial |
