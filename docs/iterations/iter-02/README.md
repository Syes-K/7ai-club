# iter-02 — Home, chat UX & LLM hardening

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **Iteration ID:** `iter-02`  
> **Status:** **Local implementation complete · pending migrations & manual QA**  
> **Roadmap phase:** 1 — MVP chat (experience upgrade)  
> **Planned release:** —  
> **Actual release:** —  
> **Git tag (optional):** `iter-02`

---

## 1. Iteration goals

- [x] Marketing home ([7ai.club/en](https://7ai.club/en) structure) with **Start chat**
- [x] Chat UX: delete/clear, Markdown, C2 visuals, sidebar cards, input & Thinking UX
- [x] Bailian streaming abort fix + LLM error UX (code shipped; **re-test AC-19**)

---

## 2. Scope

See [README-cn.md](./README-cn.md) §2 for full in/out scope.

---

## 3. Features

| Slug | Changelog | Status |
|------|-----------|--------|
| `mvp-chat` | [changelog/iter-02.md](../../features/mvp-chat/changelog/iter-02.md) | **Local complete** |

---

## 4. Visual

**C2 · Electric Ocean** — neon blue on deep navy; chat chrome uses blue neon (not solid-green sidebar CTA).

---

## 5. Todos

See [README-cn.md](./README-cn.md) §5 (T-10 – T-19). Remaining: **T-18 migrations**, **T-19 QA + commit**.

---

## 6. Acceptance

- [x] Landing AC-10 – AC-13, AC-18
- [x] Chat AC-14 – AC-17, AC-21
- [ ] Bailian AC-19 (manual re-test)
- [x] LLM errors AC-20

---

## 7. Ship checklist

1. Run both iter-02 SQL migrations in Supabase  
2. Manual QA per [changelog §5](../../features/mvp-chat/changelog/iter-02-cn.md)  
3. `pnpm build`  
4. Commit / optional tag `iter-02`

---

## 8. Revision log

| Date | Change |
|------|--------|
| 2026-06-15 | Created iter-02 |
| 2026-06-16 | Local implementation complete |
