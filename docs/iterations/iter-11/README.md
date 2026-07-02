# iter-11 — Vercel Analytics & Speed Insights

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Iteration ID:** `iter-11`  
> **Status:** **Released**  
> **Roadmap phase:** 5 — Production (observability foundation)  
> **Planned release:** 2026-07-04  
> **Actual release:** 2026-07-03  
> **Git tag (optional):** `iter-11`  
> **Prerequisite:** [iter-10](../iter-10/README.md) **released**

---

## 1. Iteration goals

- [x] Integrate Vercel Web Analytics and Speed Insights in root layout
- [x] Track three custom events: sign-up, sign-in, conversation started
- [x] URL query redaction via `beforeSend`; dev environment noop
- [x] QA C0–C4 pass and release

---

## 3. Features

| Slug | Changelog | Status |
|------|-----------|--------|
| `platform-observability` | [changelog/iter-11.md](../../features/platform-observability/changelog/iter-11.md) | **Released** |

---

## 4. Acceptance

### 4.1 Automation (qa Phase C2)

- [x] `pnpm lint` — 2026-07-03
- [x] `pnpm build` — 2026-07-03
- [x] `pnpm test` — 139 passed
- [x] `pnpm test:e2e` — 24 passed, 1 flaky iter04 (non-blocking)

### 4.2 Manual QA

- [x] changelog §5.1 + §12 — 2026-07-03
- [x] AC-111–118 checked

### 4.3 Release

- [x] changelog §5 AC checked (qa-engineer · 2026-07-03)
- [x] User confirmed: `测试已通过，可发布` (2026-07-03)

---

## 6. Gate log

| Date | Event |
|------|-------|
| 2026-07-02 | iter-11 kickoff; PRD + design + Phase B |
| 2026-07-03 | qa C0–C4: all AC checked |
| 2026-07-03 | User confirmed release; **iteration released** |

---

## 7. Revision history

| Date | Change |
|------|--------|
| 2026-07-02 | Created iter-11 |
| 2026-07-03 | QA pass; **released** |
