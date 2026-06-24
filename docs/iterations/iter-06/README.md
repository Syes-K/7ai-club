# iter-06 — Agent orchestration & stream resume

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Iteration ID:** `iter-06`  
> **Status:** **Released**  
> **Roadmap phase:** 2 — Agent orchestration foundation  
> **Planned release:** 2026-06-24  
> **Actual release:** 2026-06-24  
> **Git tag (optional):** `iter-06`

---

## 1. Goals

- [x] Refactor `/api/chat` to **WorkflowRunner + Node** pipeline (Vercel AI SDK)
- [x] **Real-time step timeline** in Chat (English)
- [x] Supabase **`workflow_runs` / `workflow_step_logs`**
- [x] **Upstash Redis** stream resume + purge after run ends
- [x] iter-05 chat regression (E2E pass)

---

## 2. Scope

See [README-cn.md](./README-cn.md) §2 for In/Out scope tables.

---

## 3. Features

| Slug | Changelog | Status |
|------|-----------|--------|
| `agent-orchestration` | [changelog/iter-06.md](../../features/agent-orchestration/changelog/iter-06.md) | **Released** |
| `mvp-chat` | [changelog/iter-06.md](../../features/mvp-chat/changelog/iter-06.md) | **Released** |

Delivery summary: see agent-orchestration changelog §3–§4.

---

## 4. Acceptance

### 4.1 Automation

- [x] `pnpm lint`, `pnpm build`, `pnpm test` (47), `pnpm test:e2e` (13), `pnpm test:ci` — all pass (2026-06-24)

### 4.2 Manual QA

- [x] agent-orchestration changelog §6 — pass (incl. single bubble on LLM refresh)

### 4.3 Release

- [x] Changelog AC-50–64 checked
- [x] PRD AC synced
- [x] User confirms: `测试已通过，可发布`
- [x] Actual release date: 2026-06-24

---

## 5. Dependencies & risks

See [README-cn.md](./README-cn.md) §5.

---

## 6. Revision history

| Date | Change |
|------|--------|
| 2026-06-24 | Created iter-06; PRD confirmed |
| 2026-06-24 | Implementation + dev calibrations |
| 2026-06-24 | QA: `pnpm test:ci` green |
| 2026-06-24 | Docs finalized; status → pending release confirmation |
| 2026-06-24 | User confirmed release; iteration **released** |
