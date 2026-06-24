# Models — Technical Design

> **English:** [models.md](./models.md)  
> **中文:** [models-cn.md](./models-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/models.md](../prd/models.md)  
> **Iteration:** iter-05

---

## 1. Design Goals

- User BYOK: per-model API key, **server-side encryption**, browser never reads ciphertext
- Model metadata CRUD via iter-04 browser layering; **key writes** via Node API only
- Model test via Node API; only `passed` consumable in Profile / Chat
- Platform default Bailian `qwen3.6-plus` as **virtual row** (not in DB); key from env `BAILIAN_API_KEY`

---

## 2. Open Question Resolutions

| ID | Resolution |
|----|------------|
| OQ-01 | **App-layer AES-256-GCM**, env `LLM_ENCRYPTION_KEY` (32-byte base64); ciphertext in separate table, `service_role` server only |
| OQ-02 | **Virtual platform default** merged in service layer; sentinel ID; `preferred_model_config_id IS NULL` = platform default |
| OQ-03 | **No duplicates:** `UNIQUE (user_id, provider, model_name)` |

---

## 3. Database

See [models-cn.md](./models-cn.md) §3 for full SQL (bilingual schema is identical).

Tables: `user_model_configs`, `user_model_config_secrets`, `user_profiles.preferred_model_config_id` (replaces `preferred_model`).

---

## 4. API (Node)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/models` | Create config + encrypted key |
| PATCH | `/api/models/[id]/key` | Update key only; reset `untested` |
| POST | `/api/models/[id]/test` | Minimal completion test |

Browser Supabase: list, update provider/model_name, delete (no secrets).

---

## 5. Encryption

`lib/llm/encryption.ts` — AES-256-GCM, `LLM_ENCRYPTION_KEY` env, format `iv:ciphertext:tag` (base64).

### 5.1 Server env vars: `LLM_ENCRYPTION_KEY` vs `SUPABASE_SERVICE_ROLE_KEY`

Both are required for user BYOK key create/update, test, and chat decryption.

| Variable | Role |
|----------|------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** — server read/write `user_model_config_secrets` (no RLS for `authenticated`) |
| `LLM_ENCRYPTION_KEY` | App-generated AES key (`openssl rand -base64 32`) — encrypt/decrypt user API keys at rest |

**Flow (create model):** `POST /api/models` → encrypt with `LLM_ENCRYPTION_KEY` → store ciphertext via `service_role` → metadata via user JWT + anon.

**Rules:** Server-only; never `NEXT_PUBLIC_`; never commit to git; restart dev server after change.

Full table and diagrams: [models-cn.md](./models-cn.md) §5.1.

---

## 6. UI

`ModelsManager` + list row + add/edit dialog + `UpdateApiKeyDialog`. Replace placeholder at `app/console/models/page.tsx`.

Async mutations use **page-level busy** — [console-shell.md](./console-shell.md) §8.

---

## 7. Files

See [models-cn.md](./models-cn.md) §10.

---

## 8. Revision History

| Date | Change |
|------|--------|
| 2026-06-17 | iter-05 initial |
| 2026-06-17 | §5.1 env var roles (`LLM_ENCRYPTION_KEY` vs `SUPABASE_SERVICE_ROLE_KEY`) |
| 2026-06-17 | §6 — console-shell §8 page-level busy |
