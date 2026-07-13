# Platform Models — Technical Design

> **English:** [platform-models.md](./platform-models.md)  
> **中文:** [platform-models-cn.md](./platform-models-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/models.md](../prd/models.md)  
> **Iteration:** iter-12

---

## 1. Database

### 1.1 `platform_model_configs`

```sql
CREATE TABLE public.platform_model_configs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name         TEXT CHECK (display_name IS NULL OR char_length(display_name) <= 128),
  provider             TEXT NOT NULL
    CHECK (provider IN ('bailian', 'deepseek', 'siliconflow', 'openai')),
  model_name           TEXT NOT NULL CHECK (char_length(trim(model_name)) BETWEEN 1 AND 128),
  model_type           TEXT NOT NULL DEFAULT 'chat'
    CHECK (model_type IN ('chat', 'embedding', 'image', 'video', 'audio', 'moderation', 'rerank')),
  embedding_dimensions INT CHECK (embedding_dimensions IS NULL OR embedding_dimensions > 0),
  enabled              BOOLEAN NOT NULL DEFAULT true,
  sort_order           INT NOT NULL DEFAULT 0,
  test_status          TEXT NOT NULL DEFAULT 'untested'
    CHECK (test_status IN ('untested', 'passed', 'failed')),
  tested_at            TIMESTAMPTZ,
  test_error           TEXT CHECK (test_error IS NULL OR char_length(test_error) <= 500),
  api_key_set          BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT platform_model_configs_unique
    UNIQUE (provider, model_name, model_type)
);

CREATE INDEX platform_model_configs_sort_idx
  ON public.platform_model_configs (sort_order, created_at);
```

### 1.2 `platform_model_config_secrets`

```sql
CREATE TABLE public.platform_model_config_secrets (
  config_id           UUID PRIMARY KEY
    REFERENCES public.platform_model_configs(id) ON DELETE CASCADE,
  api_key_ciphertext  TEXT NOT NULL,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS enabled, no policies for authenticated (service_role only)
```

### 1.3 RLS

| Table | authenticated | Notes |
|-------|---------------|-------|
| `platform_model_configs` | `SELECT` where `enabled = true` **or** admin via API | Users see enabled metadata; `test_status` visible |
| `platform_model_config_secrets` | **No policies** | service_role only |

Admin writes **only** via `/api/admin/models/*` + service_role.

### 1.4 `user_profiles` migration

```sql
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_preferred_model_config_id_fkey;

-- preferred_model_config_id may point to user_model_configs.id or platform_model_configs.id
-- Resolved in application layer by resolveUserModelForChat

UPDATE public.user_profiles up
SET preferred_model_config_id = (
  SELECT id FROM public.platform_model_configs
  WHERE enabled AND test_status = 'passed' AND model_type = 'chat'
  ORDER BY sort_order ASC, created_at ASC
  LIMIT 1
)
WHERE preferred_model_config_id IS NULL;
```

### 1.5 Seed

```sql
INSERT INTO public.platform_model_configs (
  display_name, provider, model_name, model_type, enabled, sort_order, test_status
) VALUES (
  'Bailian qwen3.6-plus', 'bailian', 'qwen3.6-plus', 'chat', true, 0, 'untested'
);
-- Key must be entered via Admin UI; do not import from env
```

---

## 2. API (Admin)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/models` | Full list (incl. disabled) |
| POST | `/api/admin/models` | Create + key |
| PATCH | `/api/admin/models/[id]` | Metadata |
| PATCH | `/api/admin/models/[id]/key` | Update key → untested |
| POST | `/api/admin/models/[id]/test` | Connectivity test |
| POST | `/api/admin/models/[id]/disable` | `enabled=false` |
| DELETE | `/api/admin/models/[id]` | 409 if user preference references row |

Reuse patterns from `app/api/models`: `parseCreateModelBody`, `runModelConnectivityTest`, `upsertPlatformModelSecret`.

---

## 3. User-side reads

### 3.1 `lib/platform/model-configs.ts` (new)

```typescript
export async function listPlatformModelConfigsForUser(): Promise<PlatformModelConfigDto[]>;
// browser supabase SELECT enabled rows ORDER BY sort_order

export function mergeUserAndPlatformModels(
  userRows: ModelConfigDto[],
  platformRows: PlatformModelConfigDto[],
): ModelConfigDto[]; // platform rows: isPlatform: true, readOnly
```

### 3.2 Remove

- `buildPlatformDefaultDto` / `mergePlatformDefault`
- `PLATFORM_DEFAULT_CONFIG_ID` sentinel (UI uses real UUIDs)
- `getPlatformDefaultApiKey()` / `buildPlatformDefaultResolved()`

### 3.3 `resolveUserModelForChat` algorithm

1. `preferredConfigId == null` → `resolveDefaultPlatformChatModel()` (first passed+enabled+chat)
2. Query `user_model_configs` where `id` and `user_id` → user BYOK path
3. Else query `platform_model_configs` where `id` and `enabled` and `test_status=passed` → platform path + decrypt secrets
4. None → `null` / `ModelNotReadyError`

---

## 4. Profile / Console

- `listModelConfigsForUser` → merge read-only platform rows
- `savePreferences` → `allowedIds` includes platform passed UUIDs
- `normalizePreferredConfigId` — **remove** sentinel-to-null; keep real platform UUIDs

---

## 5. File list

| Action | Path |
|--------|------|
| Add | `lib/platform/model-configs.ts`, `lib/platform/secrets.ts` |
| Add | `app/api/admin/models/**` |
| Modify | `lib/llm/resolve-user-model.ts`, `lib/console/model-configs.ts` |
| Modify | `lib/constants/model-providers.ts` |
| Modify | `lib/services/browser/profile.ts` |

---

## 6. AC mapping

AC-127 – AC-133, AC-129, AC-130, AC-131, AC-132
