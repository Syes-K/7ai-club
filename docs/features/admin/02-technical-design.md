# Platform Admin — Technical Design Index

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文:** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `admin`  
> **Iteration:** `iter-12`  
> **Roadmap phase:** 2 — Platform operations  
> **PRD:** [01-product-requirements.md](./01-product-requirements.md)  
> **Status:** **Draft** (pending confirm)  
> **Date:** 2026-07-12  
> **Version:** v0.1

---

## 1. Overview

### 1.1 Design goals

- `/admin` three pages (Users / Models / Assistants) + unified `requireAdmin()` auth
- Platform free models in DB (`platform_model_configs` + secrets); **remove** virtual `PLATFORM_DEFAULT` and `BAILIAN_API_KEY`
- System assistants via `assistants.is_platform`; New Chat **aggregated list** (personal first, system last)
- User management via Supabase Auth Admin API (`service_role`)
- Console / Chat **cross changes:** [design/integration.md](./design/integration.md)

### 1.2 Architecture alignment

| Item | Choice |
|------|--------|
| Admin UI | Next.js App Router; `components/admin/*` mirrors Console Shell |
| Admin API | `export const runtime = "nodejs"`; `/api/admin/*` |
| Auth | `ADMIN_EMAILS` env + session `user.email`; middleware + layout + API layers |
| Platform model keys | AES-256-GCM (reuse `lib/llm/encryption.ts` + `platform_model_config_secrets`) |
| User BYOK | **Unchanged** (`user_model_configs`) |
| Privileged data | `createServiceClient()` — user list, ban, platform secrets |

---

## 2. Document map

| Topic | Design doc |
|-------|------------|
| Admin shell & routes | [design/admin-shell.md](./design/admin-shell.md) |
| Auth | [design/admin-auth.md](./design/admin-auth.md) |
| User management | [design/users.md](./design/users.md) |
| Platform models | [design/platform-models.md](./design/platform-models.md) |
| Platform assistants + picker | [design/platform-assistants.md](./design/platform-assistants.md) |
| Console / Chat integration | [design/integration.md](./design/integration.md) |

**Cross-feature design deltas:**

| Feature | Doc |
|---------|-----|
| `console` | [console/design/models.md](../console/design/models.md) §14 · [console/changelog/iter-12.md](../console/changelog/iter-12.md) |
| `mvp-chat` | [mvp-chat/design/chat-model-config.md](../mvp-chat/design/chat-model-config.md) §10 |

---

## 3. Database summary (iter-12)

| Object | Notes |
|--------|-------|
| `platform_model_configs` | Platform free model metadata |
| `platform_model_config_secrets` | Encrypted API keys (service_role only) |
| `assistants.is_platform` | System assistant flag |
| `assistants.enabled` | Platform assistant visibility to users |
| `user_profiles` | Relax `preferred_model_config_id` FK; may point to platform or user config |
| Migration | `supabase/migrations/20260712000000_iter12_platform_admin.sql` |

See [design/platform-models.md](./design/platform-models.md) · [design/platform-assistants.md](./design/platform-assistants.md).

---

## 4. API summary

| Prefix | Auth | Notes |
|--------|------|-------|
| `/api/admin/users` | `requireAdmin()` | List, disable, enable, reset-password |
| `/api/admin/models` | `requireAdmin()` | Platform model CRUD, key, test |
| `/api/admin/assistants` | `requireAdmin()` | Platform assistant CRUD |

Browser **must not** read platform secrets directly; users read platform metadata via RLS `SELECT` (authenticated).

---

## 5. File change list (index)

| Action | Path |
|--------|------|
| Add | `app/admin/**`, `components/admin/**`, `lib/admin/**` |
| Add | `app/api/admin/**` |
| Add | `supabase/migrations/20260712000000_iter12_platform_admin.sql` |
| Modify | `middleware.ts`, `components/layout/site-header.tsx` (Admin entry) |
| Modify | `lib/console/model-configs*.ts`, `lib/llm/resolve-user-model.ts`, `lib/llm/provider.ts` |
| Modify | `lib/services/browser/assistants.ts`, `components/chat/assistant-picker-dialog.tsx` |
| Modify | `lib/services/browser/profile.ts`, `components/console/preferences-card.tsx` |
| Add | `tests/unit/admin/**`, `tests/e2e/iter12-admin.spec.ts` |
| Remove | `BAILIAN_API_KEY` read path, `PLATFORM_DEFAULT` virtual injection, `ensure_user_assistants` copy logic |

Full lists in each subdoc §7–§9.

---

## 6. Environment variables

| Variable | Notes |
|----------|-------|
| `ADMIN_EMAILS` | **New** — comma-separated admin emails |
| `LLM_ENCRYPTION_KEY` | Existing — platform + user key encryption |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing — Admin API, secrets |
| `BAILIAN_API_KEY` | **Deprecated** — remove from `.env.example` / README |

---

## 7. Test plan (§11 summary)

| Type | Path |
|------|------|
| Unit | `tests/unit/admin/auth.test.ts`, `resolve-platform-model.test.ts` |
| E2E | `tests/e2e/iter12-admin.spec.ts` |
| Regression | Update existing `model-config`, `assistants` unit tests |

---

## 8. Open question resolutions

| ID | Question | Resolution |
|----|----------|------------|
| OQ-D01 | How `preferred_model_config_id` references platform UUID | **Drop FK to user table**; app resolves: `user_model_configs` first (must match `user_id`), then `platform_model_configs` (must be passed+enabled) |
| OQ-D02 | `preferred NULL` migration | Set to first `passed+enabled+chat` platform model ID; else keep NULL |
| OQ-D03 | `ensure_user_assistants` RPC | **No-op**: SELECT user assistants only, no INSERT |
| OQ-D04 | Disable user | `auth.admin.updateUserById` + `ban_duration`; enable with `ban_duration: 'none'` |
| OQ-D05 | Admin UI style | shadcn/ui + Console layout pattern; no separate design-system page override |

---

## 9. PRD acceptance mapping (§12 · iter-12)

> qa-engineer C0 input. Primary AC in admin changelog; Console/MVP regression in [integration.md](./design/integration.md) §6.

| AC ID | Implementation | Verification |
|-------|----------------|--------------|
| AC-120 | `GET /api/admin/users` paginated + join `user_profiles` + counts | unit + e2e |
| AC-121 | Query param `q` debounced search email/nickname | unit |
| AC-122 | `POST .../disable` → `ban_duration` | unit + manual |
| AC-123 | `POST .../enable` → clear ban | unit |
| AC-124 | `POST .../reset-password` → Auth Admin email | manual |
| AC-125 | disable rejects `user.id === admin.id` | unit |
| AC-126 | Non-admin → middleware/layout/API 403 | e2e |
| AC-127 | `platform_model_configs` CRUD + encrypted secrets | unit + e2e |
| AC-128 | test endpoint; only passed+enabled selectable by users | unit |
| AC-129 | Profile dropdown merges platform passed rows | e2e |
| AC-130 | Console Models read-only Platform rows | e2e |
| AC-131 | `resolveUserModelForChat` decrypts platform key | unit |
| AC-132 | Remove `buildPlatformDefaultResolved` env path | unit + grep |
| AC-133 | BYOK `/api/models` regression | existing tests |
| AC-134 | `/api/admin/assistants` CRUD | e2e |
| AC-135 | `listAssistantOptions` aggregated sort + Platform badge | unit + e2e |
| AC-136 | Platform `assistantId` creates conversation | e2e |
| AC-137 | RPC no-op; no template copy | unit + Supabase MCP |
| AC-138 | Personal entries before system entries | unit |
| AC-139 | Chat workflow still uses `resolveUserModelForChat` | unit |
| AC-140 | `enabled=false` excluded from list query | unit |
| AC-141 | `/api/admin/assistants` non-admin 403 | e2e |

---

## 10. Revision history

| Date | Version | Change |
|------|---------|--------|
| 2026-07-12 | v0.1 | iter-12 initial draft |

---

*Iteration index:* [iter-12/README.md](../../iterations/iter-12/README.md)
