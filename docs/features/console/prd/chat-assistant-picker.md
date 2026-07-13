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

> **Superseded by iter-12:** no seed. Zero personal assistants → enabled system assistants still listed at bottom. See [admin/prd/assistants.md](../../admin/prd/assistants.md) §4.

- ~~Run seed (see assistants §3.4)~~ (deprecated)
- Optional *"No personal assistants yet."* + link to Console

### 3.2 iter-12 — Aggregated picker

> Full spec: [admin/prd/assistants.md](../../admin/prd/assistants.md) §4 (F-34)

**Single list** (no tabs): personal assistants first, system assistants (`is_platform`, enabled) last. System rows: **Platform** badge.

### 3.3 Existing conversations

- Unchanged: still bound to original `assistant_id` (including legacy global assistant)

---

## 4. Acceptance Criteria

- [ ] **AC-09** — New Chat opens picker; cannot create without selection
- [ ] **AC-10** — New chat uses selected system prompt + Profile model preference

### iter-12

- [ ] **AC-135** — Aggregated list; personal before system ([admin/changelog/iter-12.md](../../admin/changelog/iter-12.md))
- [ ] **AC-136** — System assistant create conversation works

---

## 5. Revision History

| Date | Change |
|------|--------|
| 2026-06-16 | Initial |
| 2026-07-12 | iter-12 — §3.2 aggregated list; §3.1 seed superseded |
