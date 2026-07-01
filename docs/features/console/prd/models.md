# Model Management

> **English:** [models.md](./models.md)  
> **中文:** [models-cn.md](./models-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-05

---

## 1. Scope

F-24 — `/console/models`: user BYOK model configs, encrypted API keys, connectivity test, platform default row.

---

## 2. User Stories


| ID    | Story                                                                                        | Priority |
| ----- | -------------------------------------------------------------------------------------------- | -------- |
| US-30 | As a user, I want to add provider + model name + API key on Models and test connectivity     | P0       |
| US-31 | As a user, failed configs must not appear in Profile or be used in Chat                      | P0       |
| US-32 | As a user, I want a separate secure flow to update keys without seeing plaintext in the list | P0       |
| US-36 | As a new user, I get a platform default Bailian qwen3.6-plus so I can chat immediately       | P0       |


---

## 3. F-24 Models Page

### 3.1 Route & Layout

- Route: `/console/models`
- Replaces iter-03 placeholder ([placeholders.md](./placeholders.md) §3)
- Page title (English): **Model management**
- Main area: config list + **Add model** entry

### 3.2 Supported Providers (MVP)


| Provider ID   | Display name | Default base URL (product layer; tech design may override) |
| ------------- | ------------ | ---------------------------------------------------------- |
| `bailian`     | Bailian      | DashScope compatible-mode                                  |
| `deepseek`    | DeepSeek     | DeepSeek OpenAI-compatible API                             |
| `siliconflow` | SiliconFlow  | SiliconFlow OpenAI-compatible API                          |
| `openai`      | OpenAI       | OpenAI API                                                 |


**Out of Scope (this iteration):** Anthropic, Azure OpenAI, user-defined OpenAI-compatible base URL.

### 3.3 Config Record Fields


| Field            | Description                                                                      |
| ---------------- | -------------------------------------------------------------------------------- |
| Provider         | One of four                                                                      |
| Model name       | User input, e.g. `qwen3.6-plus`, `deepseek-chat`, `gpt-4o-mini`                  |
| API Key          | **Per model** key; encrypted in DB; **never** returned in API or UI as plaintext |
| Test status      | `Untested` · `Passed` · `Failed`                                                 |
| Tested at        | Last test timestamp (optional display)                                           |
| Test error       | Short English summary when Failed                                                |
| Platform default | Boolean; see §3.5                                                                |


### 3.4 List Display (English UI)

Each row shows at minimum:

- Provider name + model name
- Key status: `Configured` / `Not set` (not plaintext)
- Test status badge: `Untested` / `Passed` / `Failed`
- Actions: **Edit** · **Test** · **Update API key** · **Delete**

**Empty state (no user configs besides platform default):**

- Copy example: "No custom models yet. Add a model to use your own API key."
- **Add model** button

### 3.5 Platform Default Config


| Item        | Rule                                                                         |
| ----------- | ---------------------------------------------------------------------------- |
| Provider    | `bailian`                                                                    |
| Model name  | `qwen3.6-plus`                                                               |
| API Key     | **No user key stored**; runtime reads env `BAILIAN_API_KEY`                  |
| Visibility  | **Visible** on Models page, labeled **Platform default**                     |
| Key edit    | **Not** editable in UI                                                       |
| Delete      | **Not** deletable                                                            |
| Test status | Always **Passed** (or equivalent: no Test button / fixed Passed)             |
| New users   | Must have this config available on first use (seed vs virtual — tech design) |


### 3.6 Add / Edit Form

**Add model:**


| Field      | Required | Notes                 |
| ---------- | -------- | --------------------- |
| Provider   | Yes      | Dropdown              |
| Model name | Yes      | Text; trim; non-empty |
| API Key    | Yes      | Password input        |


**Edit model (non-platform-default):**


| Field      | Editable | Notes                                     |
| ---------- | -------- | ----------------------------------------- |
| Provider   | Yes      | Changing resets test status to `Untested` |
| Model name | Yes      | Changing resets test status to `Untested` |
| API Key    | —        | **Not** in this form; see §3.7            |


### 3.7 Update API Key (Separate Flow)

- Entry: **Update API key** button or dedicated block on edit view
- UI: modal / drawer with password field + **Save key**
- Rules:
  - List/detail APIs **never** return key plaintext or ciphertext
  - Saving a new key resets test status to `Untested`
- Platform default: **no** this entry

### 3.8 Model Test

**Trigger:** **Test** on list or edit (disabled or hidden for platform default).

**Behavior (product layer):**

1. Server test endpoint (Node Route Handler; `getUser()` required)
2. Uses config's provider + model name + key (platform default uses env key)
3. Minimal completion (e.g. user message `"Hi"`); non-empty assistant reply → **Passed**
4. Failure → **Failed** with persisted short English `test_error`; key retained

**Consumption rules:**


| Test status | Profile selectable | Chat usable |
| ----------- | ------------------ | ----------- |
| Passed      | Yes                | Yes         |
| Untested    | No                 | No          |
| Failed      | No                 | No          |


Re-test required after provider, model name, or API key changes.

### 3.9 Delete

- User configs: deletable
- If config is current Profile preference: **block** (English: "This model is your current preference. Choose another model in Profile first.")
- Platform default: not deletable

### 3.10 iter-09 delta — Model type (incl. Embedding)

> **Iteration:** iter-09 (knowledge-base RAG) · migration `20260630180000_user_model_config_type.sql`

**New fields (per user config):**

| Field | Description |
|-------|-------------|
| **Model type** | `chat` (default) · `embedding` · `image` · `video` · `audio` · `moderation` · `rerank` |
| **Embedding dimensions** | Required when `type=embedding` (e.g. 1024); stored on KB at create |

**Unique constraint:** `(user_id, provider, model_name, model_type)` — same provider + model name may exist as both chat and embedding.

**List (English UI):** add **Type** column.

**Test behavior by type:**

| Model type | Probe |
|------------|-------|
| `chat` | Minimal chat completion (§3.8) |
| `embedding` | Provider `/embeddings`; dimensions must match configured value |

**Consumption (iter-09):**

| Model type | Profile | Usage |
|------------|---------|-------|
| `chat` + Passed | Preferred chat model | Chat / workflow LLM |
| `embedding` + Passed | Embedding model (RAG Preferences) | New KB default; ingest / retrieve uses matching API key |
| Other types | Not selectable in iter-09 | Reserved |

Platform default chat rules unchanged. **Embedding platform default** from env (`RAG_EMBEDDING_*`), listed **first** in Profile embedding dropdown (not a Models table row).

---

## 4. Permissions & Security (Product Layer)


| Action                 | Who                             | Notes                          |
| ---------------------- | ------------------------------- | ------------------------------ |
| View Models page       | Signed-in users                 | Own configs + platform default |
| CRUD user configs      | Owner                           | RLS                            |
| View API key plaintext | **Nobody** (including owner UI) | Only Configured / Not set      |
| Test / Chat key usage  | Server Node                     | Decrypt then call provider     |
| Platform default key   | Server env                      | `BAILIAN_API_KEY`              |


---

## 5. Non-Functional Requirements


| Type        | Requirement                                                                        |
| ----------- | ---------------------------------------------------------------------------------- |
| Security    | Keys encrypted in DB; browser / Supabase direct layer never exposes decrypted keys |
| Performance | Test timeout comparable to chat (ms TBD in tech design)                            |
| Usability   | Failed state shows actionable English summary                                      |


---

## 6. Acceptance Criteria

- [x] **AC-40** — Models CRUD; no API key in network responses
- [x] **AC-41** — Separate Update API key flow; editing provider/model name does not overwrite key
- [x] **AC-42** — Test Passed persisted; Failed shows summary; Untested/Failed not selectable in Profile
- [x] **AC-47** — Chat uses user key; platform default uses env `BAILIAN_API_KEY`
- [x] **AC-48** — Key / provider / model name change resets status to Untested (except platform default)

---

## 7. Dependencies & Assumptions

### 7.1 Dependencies

- iter-04 browser layering (Profile CRUD on Supabase)
- `POST /api/chat` remains Node (LLM keys)

### 7.2 Assumptions

- All four providers expose OpenAI-compatible chat completions
- Deployment has `BAILIAN_API_KEY` for platform default

---

## 8. Open Questions


| ID    | Question                                               | Status | Resolution                 |
| ----- | ------------------------------------------------------ | ------ | -------------------------- |
| OQ-01 | Key encryption: Vault vs app-layer AES                 | Open   | Tech design                |
| OQ-02 | Platform default for new users: DB seed vs virtual row | Open   | Tech design                |
| OQ-03 | Duplicate provider + model name                        | Open   | Recommend block duplicates |


---

## 9. Revision History


| Date       | Change                          |
| ---------- | ------------------------------- |
| 2026-06-17 | iter-05 initial — PRD confirmed |
| 2026-06-30 | §3.10 iter-09 — model type + embedding test / Profile consumption |


