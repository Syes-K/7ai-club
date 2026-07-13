# iter-12 — Platform Admin

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Iteration ID:** `iter-12`  
> **Status:** **Released**  
> **Roadmap phase:** 2 — Platform operations  
> **Planned release:** 2026-07-13  
> **Actual release:** 2026-07-13  
> **Git tag (optional):** `iter-12`  
> **Prerequisite:** [iter-11](../iter-11/README.md) **released**

---

## 1. Iteration Goals

- [x] `/admin` route with `ADMIN_EMAILS` allowlist auth
- [x] User management: list, disable/enable (~~password reset~~ → [todoList AUTH-01](../../todoList/backlog-cn.md))
- [x] Platform free models: admin CRUD; deprecate `BAILIAN_API_KEY` virtual default
- [x] Platform assistants: admin CRUD; New Chat aggregated list (system last); remove auto seed
- [x] In-iteration manual fixes (see [admin/changelog/iter-12.md §7](../../features/admin/changelog/iter-12.md))
- [x] QA C4 acceptance (AC-120–123, 125–141; AC-124 out of scope)
- [x] User `测试已通过，可发布`

---

## 2. Scope

### In Scope

| Area | Summary |
|------|---------|
| **Routes** | `app/admin/*` — users, models, assistants |
| **Auth** | middleware + layout + `/api/admin/*` unified `requireAdmin()` |
| **Users** | Paginated list, search, disable, enable |
| **Platform models** | Encrypted keys, test gate, Enable/Disable, Profile / Console integration |
| **Platform assistants** | `is_platform`, aggregated picker (personal first) |
| **Ban enforcement** | Disabled users blocked on pages and APIs via middleware (`lib/auth/session`) |
| **Migration** | Remove virtual `PLATFORM_DEFAULT`; platform assistant RPC |
| **Tests** | unit + e2e for admin flows |
| **Docs** | Feature PRD, changelog, technical design, `docs/todoList/` |

### Out of Scope

- Admin password reset (→ todoList **AUTH-01**)
- Multi-role RBAC
- Platform assistant KB / MCP binding
- Admin analytics dashboard
- OAuth provider management

---

## 3. Features

| Slug | PRD | Design | Priority | Status |
|------|-----|--------|----------|--------|
| `admin` | [01-product-requirements.md](../../features/admin/01-product-requirements.md) | [02-technical-design.md](../../features/admin/02-technical-design.md) | P0 | **Released** |

**Cross-feature changelogs (same iteration):**

| Feature | Changelog |
|---------|-----------|
| `console` | [changelog/iter-12.md](../../features/console/changelog/iter-12.md) |
| `mvp-chat` | [changelog/iter-12.md](../../features/mvp-chat/changelog/iter-12.md) |

Docs live under `docs/features/admin/` — not duplicated in this iteration folder.

---

## 4. Acceptance

### 4.1 Automation (qa Phase C2)

- [x] `pnpm lint`
- [x] `pnpm build`
- [x] `pnpm test` (167 tests)
- [x] `pnpm test:e2e` (35 passed, 15 skipped)

### 4.2 Manual QA (qa Phase C0 + C3)

- [x] changelog **§5.1 Test Matrix** filled (C0)
- [x] changelog **§12 Manual Script** executed (C3)
- [x] In-iteration fixes **H-01–H-10** recorded in [admin changelog §7](../../features/admin/changelog/iter-12.md)
- [x] AC-120–141 checked (AC-124 out of scope) — **qa-engineer C4 2026-07-13**

### 4.3 Release

- [x] changelog §5 AC all checked (qa-engineer C4; except AC-124)
- [x] User confirmed: `测试已通过，可发布` (2026-07-13)

---

## 5. Dependencies & Risks

| Item | Notes |
|------|-------|
| Depends on | iter-11 released; `SUPABASE_SERVICE_ROLE_KEY`, `LLM_ENCRYPTION_KEY`, `ADMIN_EMAILS` |
| Mitigated | New-user profile defaults (H-01); platform model disable fallback (H-03); ban API enforcement (H-06) |
| Env | `ADMIN_EMAILS`; remove `BAILIAN_API_KEY` from deployment docs |

---

## 6. Gate Log

| Date | Event |
|------|-------|
| 2026-07-12 | iter-12 kickoff; PRD confirmed (Q1–Q7) |
| 2026-07-12 | Technical design confirmed; Phase B code delivered |
| 2026-07-13 | QA C4 complete; 21/22 AC checked (AC-124 → AUTH-01); lint/build/test/e2e pass |
| 2026-07-13 | In-iteration fixes H-01–H-10; removed Admin password reset → todoList |
| 2026-07-13 | User confirmed release; **iteration released** |

---

## 7. Revision History

| Date | Change |
|------|--------|
| 2026-07-12 | Created iter-12 |
| 2026-07-13 | Synced §7 manual fixes; status → pending C4 |
| 2026-07-13 | User confirmed; marked **Released** |
