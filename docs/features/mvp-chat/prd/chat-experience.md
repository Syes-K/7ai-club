# Chat Experience (Delete · Markdown · Assistant Prompt)

> **English:** [chat-experience.md](./chat-experience.md)  
> **中文：** [chat-experience-cn.md](./chat-experience-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-02

---

## 1. Scope

F-09 system_prompt update, F-12 delete conversation, F-13 Markdown rendering, F-14 clear current conversation messages.

---

## 2. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-09 | Delete unwanted conversations | P0 |
| US-10 | Bidirectional Markdown with code blocks | P0 |
| US-11 | Clear all messages in the current chat; keep sidebar entry | P1 |

---

## 3. F-09 system_prompt (iter-02)

English seed update — reply in Markdown; match user language; concise.

---

## 4. F-12 Delete conversation

Sidebar delete + confirm modal; hard delete; RLS owner-only; redirect after deleting active conversation.

---

## 5. F-13 Markdown

User + AI; sanitize HTML; v1 render MD after assistant stream completes.

---

## 6. F-14 Clear chat history

- **Scope:** All messages in the **current** conversation; does **not** remove the sidebar entry
- **Entry:** Chat sub-header **Clear chat** on the right (assistant title left-aligned)
- **Confirm copy (English):** “Clear chat history? All messages in this conversation will be removed. This cannot be undone.”
- Hard-delete `messages` rows; RLS owner-only
- After clear: empty chat state; conversation title reset to `New Chat`
- Disabled while streaming or submitting

---

## 7. Acceptance Criteria

- [x] **AC-14** – **AC-17**
- [x] **AC-21** Clear chat

---

## 9. Revision History

| Date | Change |
|------|--------|
| 2026-06-15 | Split from index |
| 2026-06-16 | F-14 clear chat; sidebar cards; local complete |
