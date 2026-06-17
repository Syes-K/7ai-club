# iter-03 Changelog — console

> **English:** [iter-03.md](./iter-03.md)  
> **中文:** [iter-03-cn.md](./iter-03-cn.md)  
> **Iteration:** [iter-03/README.md](../../iterations/iter-03/README.md)

---

## 1. Delivery themes

| Topic | PRD | Design |
|-------|-----|--------|
| Console shell + placeholders | [prd/placeholders.md](../prd/placeholders.md) | [design/console-shell.md](../design/console-shell.md) |
| Profile | [prd/profile.md](../prd/profile.md) | [design/profile.md](../design/profile.md) |
| Assistants CRUD | [prd/assistants.md](../prd/assistants.md) | [design/assistants.md](../design/assistants.md) |
| New Chat picker | [prd/chat-assistant-picker.md](../prd/chat-assistant-picker.md) | [design/chat-integration.md](../design/chat-integration.md) |

---

## 2. PRD vs implementation

See [iter-03-cn.md §2](./iter-03-cn.md) for full delta table (Chinese). Summary:

- **Shipped as planned:** Console shell, Profile, Assistants CRUD, picker, placeholders, migrations, middleware.
- **Extended during dev:** assistant `icon`, `opening_message`, table columns, sidebar assistant meta, `AssistantAvatar`.
- **Architecture changes:** `ChatAppShell` + session BFF (to be removed in iter-04); navigation feedback fixes.
- **Known follow-up:** BFF → browser Supabase in iter-04.

---

## 3. Acceptance (all passed)

- [x] **AC-01** – **AC-12** — see [iter-03-cn.md §4](./iter-03-cn.md)

---

## 4. Revision history

| Date | Change |
|------|--------|
| 2026-06-16 | Created |
| 2026-06-16 | Delta analysis; AC checked; iter-03 shipped |
