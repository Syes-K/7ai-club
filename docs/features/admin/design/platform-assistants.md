# Platform Assistants & Picker — Technical Design

> **English:** [platform-assistants.md](./platform-assistants.md)  
> **中文:** [platform-assistants-cn.md](./platform-assistants-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/assistants.md](../prd/assistants.md)  
> **Iteration:** iter-12

---

## 1. Database

### 1.1 `assistants` delta

```sql
ALTER TABLE public.assistants
  ADD COLUMN is_platform BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT true;

-- Migrate existing templates
UPDATE public.assistants
SET is_platform = true, enabled = true, user_id = NULL
WHERE user_id IS NULL;

-- Personal assistants
UPDATE public.assistants SET is_platform = false WHERE user_id IS NOT NULL;
```

### 1.2 RLS update

```sql
DROP POLICY IF EXISTS "assistants_select_own_or_legacy" ON public.assistants;

CREATE POLICY "assistants_select_personal_or_platform"
  ON public.assistants FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (is_platform = true AND enabled = true)
  );
```

Users **cannot** INSERT/UPDATE/DELETE `is_platform = true` rows (admin API + service_role only).

### 1.3 RPC `ensure_user_assistants` → no-op

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

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/assistants` | All platform assistants |
| POST | `/api/admin/assistants` | Create `is_platform=true, user_id=NULL` |
| PATCH | `/api/admin/assistants/[id]` | Edit |
| DELETE | `/api/admin/assistants/[id]` | 409 if conversations reference row |

Fields: name, icon, opening_message, system_prompt, enabled (no KB/MCP/model).

---

## 3. User-side list aggregation

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

Sort: **personal** `updated_at DESC` → **system** `updated_at DESC` (or `sort_order` if added later).

### 3.3 `assistant-picker-dialog.tsx`

- Single list; `isPlatform` → **Platform** badge
- Zero personal assistants: optional hint + link `/console/assistants`; list still includes system rows
- Remove implicit seed dependency on `ensureUserAssistants`

### 3.4 Create conversation

`POST /api/conversations`: validate `assistantId` is personal **or** `is_platform AND enabled` (RLS + server re-check).

---

## 4. Console Assistants

`listAssistants` / `assistants-manager`: only `user_id = auth.uid()`; no platform rows.

---

## 5. File list

| Action | Path |
|--------|------|
| Add | `app/api/admin/assistants/**` |
| Add | `lib/admin/platform-assistants.ts` |
| Modify | `lib/data/browser/assistants.ts` |
| Modify | `lib/services/browser/assistants.ts` |
| Modify | `components/chat/assistant-picker-dialog.tsx` |
| Modify | `supabase/migrations/..._iter12_platform_admin.sql` |

---

## 6. AC mapping

AC-134 – AC-141
