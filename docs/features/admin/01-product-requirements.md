# Platform Admin — Product Requirements Index

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文:** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `admin`  
> **Iteration:** `iter-12` — see [iter-12 README](../../iterations/iter-12/README.md)  
> **Roadmap phase:** 2 — Platform operations  
> **Status:** **Confirmed**  
> **PRD confirmed:** 2026-07-12  
> **Doc version:** v0.1

---

## 1. Executive Summary

Deliver **`/admin`** for platform operators. Only emails listed in `ADMIN_EMAILS` may access. Layout mirrors Console Shell; all `/admin` pages and `/api/admin/*` requests pass a **unified admin check**. This iteration ships **user management**, **platform free models**, and **platform assistants**, migrating the env-based virtual platform default model and auto-seed assistant flow into admin-managed resources **selectable by all users**.

**User-visible UI copy is English.**

---

## 2. Background & Goals

### 2.1 Background

- Architecture planned `app/admin/` (shadcn/ui) — not yet implemented
- Platform default LLM is a virtual row + `BAILIAN_API_KEY` env — not operator-configurable
- Platform assistants are `user_id IS NULL` templates copied on seed — users cannot pick system assistants directly

### 2.2 Goals

- Admins view and manage user accounts (disable, password reset)
- Admins CRUD 7ai free models; regular users select them in Profile / Chat
- Admins CRUD system assistants; users pick them in New Chat **aggregated list** (after personal assistants)
- **Fully deprecate** `BAILIAN_API_KEY` and virtual `PLATFORM_DEFAULT` row

### 2.3 Out of Scope

- Multi-role RBAC
- Org / multi-tenant
- User BYOK models (stay in `/console/models`)
- User private assistants (stay in `/console/assistants`)
- Per-assistant model on platform assistants (Profile preference, same as Console)
- Platform assistant KB / MCP binding (this iteration)
- Admin analytics / audit dashboards
- OAuth provider management

---

## 3. Global Conventions

### 3.1 Routes

| Path | Page | Auth |
|------|------|------|
| `/admin` | Redirect → `/admin/users` | Admin |
| `/admin/users` | User list & management | Admin |
| `/admin/models` | Platform free models | Admin |
| `/admin/assistants` | Platform assistants | Admin |

### 3.2 Navigation

- **Entry:** **Admin** link in header / UserMenu — visible **only** to admins
- **Admin shell:** left nav — Users → Models → Assistants (Console-like)
- **Cross-links:** header keeps **Chat** and **Console**

### 3.3 Admin Authorization

| Item | Rule |
|------|------|
| Config | `ADMIN_EMAILS` env, comma-separated |
| Match | trim + **case-insensitive** vs `auth.users.email` |
| Unauthenticated `/admin` | redirect `/login?next=<path>` |
| Logged-in non-admin | **403 page** (English: *"You do not have permission to access this area."*) |
| Middleware | protect `/admin/*` |
| Layout | server-side re-check |
| API | all `/api/admin/*` via `requireAdmin()` → `401` / `403` |
| Client | layout blocks unauthorized; optional client guard |

### 3.4 Permission Matrix

| Action | Admin | Regular user |
|--------|-------|--------------|
| Access `/admin/*` | Yes | No |
| Call `/api/admin/*` | Yes | No |
| View all users | Yes | No |
| Disable / enable user | Yes | No |
| Trigger password reset | Yes | No |
| CRUD platform models | Yes | No |
| CRUD platform assistants | Yes | No |
| Select platform models (Profile) | — | Yes (Passed only) |
| Select system assistants (New Chat) | — | Yes (read-only) |
| CRUD own models / assistants | — | Yes (Console) |

### 3.5 Platform vs User Resources

| Resource | Storage | User visibility | User edit |
|----------|---------|-----------------|-----------|
| Platform free models | `platform_model_configs` (name TBD in design) | Profile / Console Models list | No |
| User BYOK models | `user_model_configs` | Own rows | Yes |
| System assistants | `assistants.is_platform = true` | New Chat list (**after** personal) | No |
| Personal assistants | `assistants.user_id = auth.uid()` | New Chat list (**before** system) | Yes |

### 3.6 Model Resolution (Chat)

Same as Console: **no** per-assistant model. Chat uses Profile **Passed** config (platform free or user BYOK).

### 3.7 Non-Functional (Summary)

- Rendering: client components allowed on admin pages
- Security: platform model keys **AES encrypted** in DB; `service_role` + admin API only; `ADMIN_EMAILS` server-only
- Locale: user-visible UI **English**
- Performance: user list paginated (default 20 per page)

### 3.8 Feature Index

| ID | Feature | PRD | Iteration |
|----|---------|-----|-----------|
| F-30 | Admin shell & auth | this doc §3 | iter-12 |
| F-31 | User management | [prd/users.md](./prd/users.md) | iter-12 |
| F-32 | Platform free models | [prd/models.md](./prd/models.md) | iter-12 |
| F-33 | Platform assistants | [prd/assistants.md](./prd/assistants.md) | iter-12 |
| F-34 | New Chat aggregated picker | [prd/assistants.md](./prd/assistants.md) §4 | iter-12 |

---

## 4. Document Map

| Doc | Scope |
|-----|-------|
| [prd/users.md](./prd/users.md) | User list, disable, reset |
| [prd/models.md](./prd/models.md) | Platform model CRUD, migration |
| [prd/assistants.md](./prd/assistants.md) | Platform assistant CRUD, aggregated picker |
| [changelog/iter-12.md](./changelog/iter-12.md) | iter-12 delta, AC-120–141 |

Technical index: pending `02-technical-design.md` (fullstack-developer Phase A)

---

## 5. Revision History

| Date | Change |
|------|--------|
| 2026-07-12 | Initial draft; user confirmed Q1–Q7 |
