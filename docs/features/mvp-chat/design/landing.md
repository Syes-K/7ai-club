# Landing · Header · C2 Visual — Technical Design

> **English:** [landing.md](./landing.md)  
> **中文：** [landing-cn.md](./landing-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/landing.md](../prd/landing.md)  
> **Iteration:** iter-02  
> **Status:** Draft  
> **Version:** v0.1

---

## 1. Goals

Replace `app/page.tsx` redirect with public landing; shared `SiteHeader` with user display; C2 Electric Ocean tokens across home and chat.

See [landing-cn.md](./landing-cn.md) for full component tree, file list, and AC mapping.

---

## 2. Key Files

| Action | Path |
|--------|------|
| Rewrite | `app/page.tsx` |
| Add | `components/layout/site-header.tsx`, `components/landing/*` |
| Update | `app/globals.css`, `chat-layout.tsx`, `auth-form.tsx` (next redirect) |

---

## 10. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-06-15 | v0.1 | iter-02 initial |
