# iter-04 — Hybrid browser data access

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Iteration ID:** `iter-04`  
> **Status:** Shipped  
> **Roadmap phase:** 1 — MVP chat (architecture hardening)  
> **Planned release:** 2026-06-17  
> **Actual release:** 2026-06-17  
> **Git tag (optional):** `iter-04`

---

## 1. Iteration goals

- [x] Introduce clear browser-side layering: **Component → Service → Data → Supabase**
- [x] Migrate CRUD reads/writes from `/api/*` BFF to **browser Supabase** (RLS)
- [x] Keep **`POST /api/chat`** on Node (LLM keys, streaming)
- [x] Add Supabase **RPC** for atomic flows (create conversation + opening, ensure assistants)
- [x] Remove redundant BFF routes (`app/api/` — chat only)

---

## 2. Scope

### In Scope

| Area | Change |
|------|--------|
| Chat | List, session load, delete/clear → browser Supabase |
| Console | Profile, Assistants CRUD → browser Supabase |
| DB | RPC migration `20260618000000_iter04_data_access_rpc.sql` |
| Docs | [design/data-access.md](../../features/mvp-chat/design/data-access.md) |
| Tests | 21 unit + 4 iter-04 E2E + 2 smoke |

### Out of Scope

- Chat API on browser (always Node)
- RAG / MCP / knowledge base
- Auth caching / Redis
- Full removal of all server data helpers (RSC may keep thin reads)

---

## 3. Features

| Slug | Changelog | Status |
|------|-----------|--------|
| `mvp-chat` | [changelog/iter-04.md](../../features/mvp-chat/changelog/iter-04.md) | **Shipped** |
| `console` | (same changelog — shared data layer) | **Shipped** |

---

## 4. Acceptance

### 4.1 Automated

- [x] `pnpm lint` passes
- [x] `pnpm build` passes
- [x] `pnpm test` passes (21/21)
- [x] `pnpm test:e2e` passes (6/6, needs `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`)

### 4.2 Manual QA

See [changelog/iter-04.md §5](../../features/mvp-chat/changelog/iter-04.md).

- [x] Switch chats — Network check (E2E covers logic)
- [x] New chat with opening message
- [x] Console profile / assistants
- [x] Delete assistant with existing chats — error
- [x] Sign-up confirmation link on production domain

### 4.3 Release

- [x] Changelog AC-30–34 checked
- [x] User confirmed: `测试已通过，可发布`

---

## 5. Delivery summary

| Item | Notes |
|------|-------|
| Sole API route | `POST /api/chat` |
| Browser layers | `lib/data/browser` → `lib/services/browser` → components |
| Migration | applied on remote Supabase |
| Performance | switch loads messages only; layout injects `preferredModel` |
| Bundled | `/auth/callback`, E2E conversation cleanup |

No user-visible feature change; matches [prd/data-access.md](../../features/mvp-chat/prd/data-access.md).

---

## 6. Revision log

| Date | Change |
|------|--------|
| 2026-06-16 | Created iter-04 |
| 2026-06-17 | Implementation + automated tests done; status → ready for release |
| 2026-06-17 | Full CI green locally; docs synced |
| 2026-06-17 | Manual QA done; user sign-off → **shipped** |
