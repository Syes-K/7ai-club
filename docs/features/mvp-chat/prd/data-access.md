# Hybrid Data Access — Product (iter-04)

> **English:** [data-access.md](./data-access.md)  
> **中文:** [data-access-cn.md](./data-access-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-04  
> **Status:** Shipped (2026-06-17)

---

## 1. Scope

F-30 — Refactor data access: CRUD via browser Supabase; chat/LLM on Node only. **No user-visible feature change**; same behavior, faster switches, clearer architecture.

---

## 2. User-visible impact

| Area | Before | After |
|------|--------|-------|
| Switch conversation | BFF `/session` | Direct Supabase; same or faster |
| Console CRUD | BFF `/api/profile`, `/api/assistants` | Direct Supabase |
| Send message | `/api/chat` | Unchanged |

---

## 3. Non-goals

- New pages or copy changes
- OAuth, org model
- Offline support

---

## 4. Acceptance criteria

- [x] **AC-30** — Switching chats does not call deprecated BFF session route
- [x] **AC-31** — Profile save works via browser data layer
- [x] **AC-32** — Assistants CRUD works via browser data layer
- [x] **AC-33** — Create conversation still inserts opening message when configured
- [x] **AC-34** — `/api/chat` remains the only route using LLM env keys

See [changelog/iter-04.md](../changelog/iter-04.md) §6 for verification.

---

## 5. Revision history

| Date | Change |
|------|--------|
| 2026-06-16 | Initial iter-04 PRD |
| 2026-06-17 | Implemented; AC checked |
