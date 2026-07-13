# 平台助理与选择器 — 技术设计

> **English:** [platform-assistants.md](./platform-assistants.md)  
> **中文:** [platform-assistants-cn.md](./platform-assistants-cn.md)  
> **总纲:** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **PRD:** [prd/assistants-cn.md](../prd/assistants-cn.md)  
> **迭代:** iter-12

---

## 1. 数据库

### 1.1 `assistants` 增量

```sql
ALTER TABLE public.assistants
  ADD COLUMN is_platform BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT true;

-- 迁移既有模板
UPDATE public.assistants
SET is_platform = true, enabled = true, user_id = NULL
WHERE user_id IS NULL;

-- 个人助理
UPDATE public.assistants SET is_platform = false WHERE user_id IS NOT NULL;
```

### 1.2 RLS 调整

```sql
DROP POLICY IF EXISTS "assistants_select_own_or_legacy" ON public.assistants;

CREATE POLICY "assistants_select_personal_or_platform"
  ON public.assistants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (is_platform = true AND enabled = true)
  );
```

用户 **不可** INSERT/UPDATE/DELETE `is_platform = true` 行（仅 admin API + service_role）。

### 1.3 RPC `ensure_user_assistants` 改为 no-op

```sql
CREATE OR REPLACE FUNCTION public.ensure_user_assistants()
RETURNS SETOF public.assistants
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.assistants
  WHERE user_id = auth.uid()
  ORDER BY updated_at DESC;
$$;
```

---

## 2. Admin API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/assistants` | 全量平台助理 |
| POST | `/api/admin/assistants` | 创建 `is_platform=true, user_id=NULL` |
| PATCH | `/api/admin/assistants/[id]` | 编辑 |
| DELETE | `/api/admin/assistants/[id]` | 有对话引用 → 409 |

字段：name, icon, opening_message, system_prompt, enabled（无 KB/MCP/model）。

---

## 3. 用户侧列表聚合

### 3.1 `lib/data/types.ts`

```typescript
export type AssistantOption = {
  id: string;
  name: string;
  icon: string | null;
  isPlatform: boolean;
};
```

### 3.2 `listAssistantOptions`

```typescript
export async function listAssistantOptions(): Promise<AssistantOption[]> {
  const personal = await listUserAssistants(); // user_id = uid
  const platform = await listPlatformAssistants(); // is_platform, enabled
  return [
    ...personal.map(toOption),
    ...platform.map(toOption),
  ];
}
```

排序：**个人** `updated_at DESC` → **系统** `updated_at DESC`（或 `sort_order` 若后续加列）。

### 3.3 `assistant-picker-dialog.tsx`

- 单列表渲染；`isPlatform` → **Platform** badge
- 零个人助理：顶部可选 hint + 链 `/console/assistants`；列表仍含系统项
- 移除对 `ensureUserAssistants` 隐式 seed 的依赖

### 3.4 创建对话

`POST /api/conversations`：校验 `assistantId` 属于用户个人 **或** `is_platform AND enabled`（RLS + 服务端二次校验）。

---

## 4. Console Assistants

`listAssistants` / `assistants-manager`：仅 `user_id = auth.uid()`，不查平台行。

---

## 5. 文件清单

| 操作 | 路径 |
|------|------|
| 新增 | `app/api/admin/assistants/**` |
| 新增 | `lib/admin/platform-assistants.ts` |
| 修改 | `lib/data/browser/assistants.ts` |
| 修改 | `lib/services/browser/assistants.ts` |
| 修改 | `components/chat/assistant-picker-dialog.tsx` |
| 修改 | `supabase/migrations/..._iter12_platform_admin.sql` |

---

## 6. AC 映射

AC-134 – AC-141
