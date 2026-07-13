# todoList — Deferred work backlog

> **中文:** [README-cn.md](./README-cn.md)

Cross-iteration backlog for features **not** in the current iteration scope. Not a substitute for `docs/iterations/iter-NN/` (timebox goals) or feature PRD.

## Files

| File | Purpose |
|------|---------|
| [backlog.md](./backlog.md) | Open items (English) |
| [backlog-cn.md](./backlog-cn.md) | Open items (中文) |

## When to add an item

- Scope removed or deferred mid-iteration (e.g. iter-12 admin password reset → user self-service recovery)
- Product idea agreed but **not** scheduled for the current iter
- Tech debt / follow-up that should not block release

Move items to **Done** (with iter id + link) when shipped.

## Starting a new iteration

**product-analyst** (or root agent planning the iter) must:

1. Read [backlog-cn.md](./backlog-cn.md) / [backlog.md](./backlog.md)
2. List **open** items relevant to the upcoming iter
3. **Ask the user to confirm** which backlog items to include in the new iteration scope
4. Included items → PRD / `iterations/iter-NN/README*` scope; excluded items stay in backlog

Do **not** silently pull backlog into a new iter without user confirmation.

## Item ID format

`{AREA}-{NN}` — e.g. `AUTH-01`, `ADMIN-02`
