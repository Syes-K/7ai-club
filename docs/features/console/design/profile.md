# Profile — Technical Design

> **English:** [profile.md](./profile.md)  
> **中文:** [profile-cn.md](./profile-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **Iteration:** iter-03

---

## 1. Database

```sql
CREATE TABLE public.user_profiles (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname         TEXT,
  preferred_model  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## 2. Model Options Constant

`lib/constants/model-options.ts`:

```typescript
export function getModelOptionsForProvider(provider: LlmProviderId): { id: string; label: string }[]
```

Curated lists per provider (3–5 models each), e.g.:

| Provider | Example ids |
|----------|-------------|
| siliconflow | `deepseek-ai/DeepSeek-V3`, `Qwen/Qwen2.5-7B-Instruct`, … |
| nvidia | `deepseek-ai/deepseek-v4-flash`, … |
| bailian | `qwen3.6-plus`, `qwen-plus`, … |

---

## 3. API

### `GET /api/profile`

**Response 200:**

```json
{
  "email": "user@example.com",
  "nickname": "Angela",
  "preferredModel": "qwen3.6-plus",
  "modelOptions": [{ "id": "...", "label": "..." }]
}
```

- Upsert not required on GET; return nulls if no row

### `PATCH /api/profile`

**Request:**

```json
{ "nickname": "Angela", "preferredModel": "qwen3.6-plus" }
```

- Validate nickname length ≤ 32; empty string → `null`
- Validate `preferredModel` against curated list for active provider
- Upsert `user_profiles`

---

## 4. lib

`lib/console/profile.ts`:

- `getUserProfile(userId)`
- `upsertUserProfile(userId, { nickname?, preferredModel? })`

`lib/llm/provider.ts` change:

```typescript
export function resolveChatModelId(
  assistantModel?: string,
  preferredModel?: string | null,
): string {
  if (preferredModel?.trim()) return preferredModel.trim();
  if (process.env.LLM_MODEL?.trim()) return process.env.LLM_MODEL.trim();
  return getDefaultModel();
}
```

Chat route loads profile for `user.id` and passes to `getChatModel(undefined, profile.preferred_model)`.

---

## 5. Display Helpers

`lib/auth/user-display.ts`:

```typescript
export function getUserDisplayName(email: string, nickname?: string | null): string
export function getUserShortLabel(email: string, nickname?: string | null, maxLen?: number): string
```

Priority: nickname → email local-part.

Pass nickname from server layouts into `SiteHeader` / `UserMenu` / chat shell (fetch profile in layout or parallel).

---

## 6. UI

`components/console/profile-form.tsx` (client):

- Load via `GET /api/profile` on mount
- Fields: Email (disabled), Nickname, Preferred model (select)
- Save → `PATCH /api/profile` → `router.refresh()` for header

`app/console/profile/page.tsx` — renders `ProfileForm` inside shell.

---

## 7. Files

| Action | Path |
|--------|------|
| Add | migration (in shared file) |
| Add | `lib/constants/model-options.ts`, `lib/console/profile.ts` |
| Add | `app/api/profile/route.ts`, `components/console/profile-form.tsx` |
| Add | `app/console/profile/page.tsx` |
| Mod | `lib/llm/provider.ts`, `lib/auth/user-display.ts` |
| Mod | Layouts that render `SiteHeader` — pass nickname |

---

## 8. Revision History

| Date | Change |
|------|--------|
| 2026-06-16 | Initial |
