# admin — Feature Overview

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Feature slug:** `admin`  
> **Iteration:** [iter-12](../../iterations/iter-12/README.md) (in progress)

---

## Document Map (Agent Entry)

**iter-12 (current):**

1. [changelog/iter-12.md](./changelog/iter-12.md) — AC-120–141 (primary acceptance)
2. [iter-12/README.md](../../iterations/iter-12/README.md)

**Cross-feature changelogs (same iteration):**

- [console/changelog/iter-12.md](../console/changelog/iter-12.md) — Console regression
- [mvp-chat/changelog/iter-12.md](../mvp-chat/changelog/iter-12.md) — Chat model / conversation

**Read order:**

1. [01-product-requirements.md](./01-product-requirements.md) — index
2. [02-technical-design.md](./02-technical-design.md) — technical index + §12 AC mapping
3. [changelog/iter-12.md](./changelog/iter-12.md) — iteration delta
4. Sub-docs as needed: `design/*`, `prd/*`

---

## iter-12 Scope Summary

- **`/admin`** — platform admin; `ADMIN_EMAILS` allowlist
- **Users** — site-wide user list; disable account, password reset
- **Platform Models** — free model CRUD; replaces env `BAILIAN_API_KEY` virtual default
- **Platform Assistants** — system assistant CRUD; New Chat **aggregated list** (system last)
- **Chat / Profile integration** — users can select platform models and system assistants

---

*Layering:* [docs/README.md](../../README.md)
