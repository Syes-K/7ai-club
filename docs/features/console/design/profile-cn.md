# Profile — 技术设计

> **English:** [profile.md](./profile.md)  
> **中文：** [profile-cn.md](./profile-cn.md)  
> **总纲：** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **迭代：** iter-03

---

## 1. 数据库

```sql
CREATE TABLE public.user_profiles (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname         TEXT,
  preferred_model  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS：SELECT/INSERT/UPDATE 仅 user_id = auth.uid()
```

（与 migration 文件一并提交，见 assistants 设计中的迁移文件名。）

---

## 2. 模型列表常量

`lib/constants/model-options.ts` — 按 `LlmProviderId` 返回 3–5 个 `{ id, label }` 精选项。

---

## 3. API

### `GET /api/profile`

返回 `email`（auth）、`nickname`、`preferredModel`、`modelOptions`。

### `PATCH /api/profile`

Body：`{ nickname?, preferredModel? }`  
校验 nickName ≤ 32；`preferredModel` 须在精选列表内；upsert。

---

## 4. 模型解析

`resolveChatModelId(assistantModel?, preferredModel?)` 优先级：

1. `preferredModel`（profile）  
2. `LLM_MODEL` env  
3. 提供商默认  

Chat route 读取当前用户 profile 并传入 `getChatModel`。

---

## 5. 展示名

`getUserDisplayName(email, nickname?)` — 优先 nickname，否则邮箱 local-part。  
Server layout 读取 profile，传给 `SiteHeader` / `UserMenu` / chat。

---

## 6. UI

`ProfileForm`（client）：加载 GET → 编辑 → PATCH → `router.refresh()`。

---

## 7. 文件

| 操作 | 路径 |
|------|------|
| 新增 | `lib/constants/model-options.ts`、`lib/console/profile.ts` |
| 新增 | `app/api/profile/route.ts`、`components/console/profile-form.tsx` |
| 修改 | `lib/llm/provider.ts`、`lib/auth/user-display.ts`、各 layout |

---

## 8. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 初稿 |
