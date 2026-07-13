# 平台模型 — 技术设计

> **English:** [platform-models.md](./platform-models.md)  
> **中文:** [platform-models-cn.md](./platform-models-cn.md)  
> **总纲:** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **PRD:** [prd/models-cn.md](../prd/models-cn.md)  
> **迭代:** iter-12

---

## 1. 数据库

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

| 表 | authenticated | 说明 |
|----|---------------|------|
| `platform_model_configs` | `SELECT` where `enabled = true` **或** admin 经 API | 用户只见 enabled 元数据；`test_status` 可见 |
| `platform_model_config_secrets` | **无策略** | 仅 service_role |

Admin 写操作 **仅** `/api/admin/models/*` + service_role。

### 1.4 `user_profiles` 迁移

```sql
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_preferred_model_config_id_fkey;

-- preferred_model_config_id 可指向 user_model_configs.id 或 platform_model_configs.id
-- 应用层 resolveUserModelForChat 解析

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
-- Key 须 Admin UI 录入；不导入 env
```

---

## 2. API（Admin）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/models` | 全量（含 disabled） |
| POST | `/api/admin/models` | 创建 + key |
| PATCH | `/api/admin/models/[id]` | 元数据 |
| PATCH | `/api/admin/models/[id]/key` | 更新 key → untested |
| POST | `/api/admin/models/[id]/test` | 连通性测试 |
| POST | `/api/admin/models/[id]/disable` | `enabled=false` |
| DELETE | `/api/admin/models/[id]` | 有用户偏好则 409 |

复用 `app/api/models` 模式：`parseCreateModelBody`、`runModelConnectivityTest`、`upsertPlatformModelSecret`。

---

## 3. 用户侧读取

### 3.1 `lib/platform/model-configs.ts`（新）

```typescript
export async function listPlatformModelConfigsForUser(): Promise<PlatformModelConfigDto[]>;
// browser supabase SELECT enabled rows ORDER BY sort_order

export function mergeUserAndPlatformModels(
  userRows: ModelConfigDto[],
  platformRows: PlatformModelConfigDto[],
): ModelConfigDto[]; // platform 标记 isPlatform: true, readOnly
```

### 3.2 移除

- `buildPlatformDefaultDto` / `mergePlatformDefault`
- `PLATFORM_DEFAULT_CONFIG_ID` 哨兵（UI 改为真实 UUID）
- `getPlatformDefaultApiKey()` / `buildPlatformDefaultResolved()`

### 3.3 `resolveUserModelForChat` 新算法

1. `preferredConfigId == null` → `resolveDefaultPlatformChatModel()`（首条 passed+enabled+chat）
2. 查 `user_model_configs` where `id` and `user_id` → 用户 BYOK 路径
3. 否则查 `platform_model_configs` where `id` and `enabled` and `test_status=passed` → 平台路径 + decrypt secrets
4. 皆无 → `null` / `ModelNotReadyError`

---

## 4. Profile / Console

- `listModelConfigsForUser` → 合并平台只读行
- `savePreferences` → `allowedIds` 含平台 passed UUID
- `normalizePreferredConfigId` — **移除**哨兵转 null；保留真实平台 UUID

---

## 5. 文件清单

| 操作 | 路径 |
|------|------|
| 新增 | `lib/platform/model-configs.ts`、`lib/platform/secrets.ts` |
| 新增 | `app/api/admin/models/**` |
| 修改 | `lib/llm/resolve-user-model.ts`、`lib/console/model-configs.ts` |
| 修改 | `lib/constants/model-providers.ts` |
| 修改 | `lib/services/browser/profile.ts` |

---

## 6. AC 映射

AC-127 – AC-133、AC-129、AC-130、AC-131、AC-132
