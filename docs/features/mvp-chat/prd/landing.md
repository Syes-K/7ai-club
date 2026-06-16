# Marketing Home · Header · Visual (C2)

> **English:** [landing.md](./landing.md)  
> **中文：** [landing-cn.md](./landing-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-02

---

## 1. Scope

F-10 marketing home, F-11 global header and user display, C2 · Electric Ocean tokens (shared with chat).

---

## 2. User Stories

US-06 – US-08: guest landing, Start chat / header Chat, signed-in user top-right.

---

## 3. F-10 Home

Public `/` landing — **no** auto-redirect to `/chat`. Structure ref [7ai.club/en](https://7ai.club/en). **Start chat** CTA: guest → `/login?next=/chat`; authed → `/chat`. Open console: not built.

---

## 4. F-11 Header

Shared header; email or initials; Sign in / Register for guests.

---

## 5. Visual — C2 Electric Ocean

| Token | Value |
|-------|-------|
| `--bg-base` | `#0A0E27` |
| `--neon-primary` | `#0080FF` |
| `--neon-secondary` | `#BF00FF` |
| `--accent-success` | `#22C55E` |

Retro Cyber / Synthwave. Ref: [vercel.com](https://vercel.com), [railway.app](https://railway.app), [7ai.club/en](https://7ai.club/en).

---

## 6. Acceptance Criteria

- [x] **AC-10** – **AC-13**, **AC-18**

---

## 7. Revision History

| Date | Change |
|------|--------|
| 2026-06-15 | Split from index |
| 2026-06-16 | Local implementation complete |
