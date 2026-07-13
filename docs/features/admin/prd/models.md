# Platform Free Models

> **English:** [models.md](./models.md)  
> **中文:** [models-cn.md](./models-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-12

---

## 1. Scope

F-32 — `/admin/models`: admins CRUD **free models** offered to all users; replaces virtual `PLATFORM_DEFAULT` and env `BAILIAN_API_KEY` (**fully deprecated**).

Regular users see and select **Passed** platform models in **Profile Preferences** and **Console Models** (alongside BYOK).

---

## 2. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-44 | As an admin, I want multiple platform free models | P0 |
| US-45 | As an admin, I want connectivity tests so only working models are offered | P0 |
| US-46 | As a user, I can pick platform models in Profile for chat | P0 |
| US-47 | As a user, my BYOK configs are unaffected | P0 |

---

## 3. F-32 Platform Models Page

### 3.1 Route & Layout

- Route: `/admin/models`
- Title (English): **Platform models**
- List + **Add model**; UX mirrors `/console/models`

### 3.2 Providers (MVP)

Same as Console: `bailian`, `deepseek`, `siliconflow`, `openai`.

### 3.3 Fields per Platform Model

| Field | Notes |
|-------|-------|
| Display name | optional English label |
| Provider | required |
| Model name | required |
| API Key | AES encrypted in DB; never shown in UI |
| Model type | `chat` default; same enum as Console |
| Embedding dimensions | required when type=embedding |
| Enabled | false hides from users |
| Sort order | ascending in user lists |
| Test status | Untested / Passed / Failed |

### 3.4 List UI (English)

Columns + actions: Edit, Test, Update API key, Disable/Enable, Delete.

Empty: *"No platform models yet. Add a model to offer free LLM access."*

### 3.5 Forms & Test

Aligned with Console Models: key update flow; test resets on provider/model change.

**User-consumable:** only **Passed + Enabled**.

### 3.6 Delete Rules

Block delete if users still prefer this model; suggest Disable instead.

### 3.7 Migration from Virtual Default

| Item | Rule |
|------|------|
| Deprecate | `BAILIAN_API_KEY`, `PLATFORM_DEFAULT_CONFIG_ID` injection |
| Seed | migration inserts Bailian `qwen3.6-plus` row; admin must enter Key in UI |
| Legacy NULL preference | design maps to first Passed platform chat model |
| Console Models | read-only **Platform** rows for users |
| Profile | Passed platform + Passed BYOK |

### 3.8 Permissions

Admins CRUD via `/api/admin/models/*`; users read-only list + select Passed models.

---

## 4. Acceptance Criteria

- [ ] **AC-127** — Admin CRUD with encrypted keys
- [ ] **AC-128** — Test gate; only Passed + Enabled for users
- [ ] **AC-129** — Profile lists Passed platform models
- [ ] **AC-130** — Console shows read-only Platform rows
- [ ] **AC-131** — Chat uses decrypted platform key
- [ ] **AC-132** — `BAILIAN_API_KEY` / virtual default removed
- [ ] **AC-133** — BYOK flows unchanged

---

## 5. Revision History

| Date | Change |
|------|--------|
| 2026-07-12 | Initial; deprecate BAILIAN_API_KEY confirmed |
