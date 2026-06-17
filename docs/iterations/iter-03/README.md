# iter-03 — Console

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Iteration ID:** `iter-03`  
> **Status:** Shipped  
> **Roadmap phase:** 1 — MVP chat + config UI  
> **Planned release:** 2026-06-16  
> **Actual release:** 2026-06-16  
> **Git tag (optional):** `iter-03`

---

## 1. Iteration goals

- [x] Console shell + sidebar (Profile, Models, Assistants, Knowledge Base, MCP)
- [x] Profile: nickName + preferred chat model
- [x] Assistants: multi-assistant CRUD (Name, Icon, Opening message, System prompt)
- [x] New Chat: required assistant picker; opening message as first assistant turn
- [x] Placeholder pages for Models / KB / MCP
- [x] C2 visual parity with landing
- [x] Chat integration: client session load + navigation UX fixes

---

## 2. Scope

See [README-cn.md](./README-cn.md) for full scope. **Out of scope:** RAG, MCP wiring, model provider UI, per-assistant model, OAuth, browser Supabase (→ iter-04).

---

## 3. Features

| Slug | Status |
|------|--------|
| `console` | **Shipped** |

---

## 4. Acceptance

- [x] All AC-01–12 in [changelog/iter-03.md](../../features/console/changelog/iter-03.md)
- [x] `pnpm build` passes
- [x] Migrations applied

**PRD vs implementation delta:** [changelog/iter-03-cn.md §2](../../features/console/changelog/iter-03-cn.md).

---

## 5. Revision log

| Date | Change |
|------|--------|
| 2026-06-16 | Created iter-03 |
| 2026-06-16 | Marked shipped; icon/opening + ChatAppShell |
