# Hybrid Browser Data Access — Technical Design

> **English:** [data-access.md](./data-access.md)  
> **中文:** [data-access-cn.md](./data-access-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/data-access.md](../prd/data-access.md)  
> **Iteration:** iter-04  
> **Status:** Implemented  
> **Document version:** v1.0

---

## 1. Goals

- **Single rule:** Node for secrets & streaming; browser Supabase for RLS-protected CRUD
- **Clear layers** so components never call Supabase directly
- **Atomic server-side logic** moves to Postgres RPC where needed
- **Remove** redundant BFF routes after migration

---

## 2. Traffic split

| Operation | Channel | Reason |
|-----------|---------|--------|
| Stream chat | `POST /api/chat` (Node) | LLM API keys, `streamText`, timeout |
| List conversations | Browser → Supabase | RLS `conversations` + join `assistants` |
| Load messages + assistant meta | Browser → Supabase (parallel) | RLS |
| Create conversation + opening message | Browser → **RPC** | Atomic multi-step |
| Delete conversation / clear messages | Browser → Supabase | RLS |
| Profile / Assistants CRUD | Browser → Supabase (+ RPC for seed/delete guard) | RLS |
| Model label display | Browser service | `lib/constants/model-options.ts` + public provider constant |

**Never in browser:** `service_role`, LLM keys, `lib/llm/provider.ts` secret paths.

---

## 3. Layering (browser)

```
components/                 # UI only; calls hooks or services
    ↓
hooks/ (optional)           # useConversationSession, useAssistants — loading/error/refetch
    ↓
lib/services/browser/       # Use cases: orchestration, validation, DTO assembly
    ↓
lib/data/browser/           # Repositories: pure Supabase queries
    ↓
lib/supabase/client.ts
```

### 3.1 Layer rules

| Layer | May | Must not |
|-------|-----|----------|
| **Component** | Render, event handlers | `createClient()`, `fetch('/api/...')` for CRUD |
| **Hook** | Compose service + React state | SQL / table names |
| **Service** | Parallel fetch, map to DTO, call RPC, validate with Zod | Tailwind, DOM |
| **Data** | `.from().select()` etc. | Business rules (e.g. delete guard) |
| **Types** | `lib/data/types.ts` shared shapes | — |

### 3.2 Server symmetry (unchanged chat path)

```
app/api/chat/route.ts
lib/services/server/chat.ts      # stream orchestration
lib/data/server/                 # loadMessages etc. for chat route only
lib/supabase/server.ts
```

RSC layouts may keep thin server reads; **new CRUD must not add BFF routes**.

---

## 4. Directory layout (target)

```
lib/
  data/
    types.ts
    browser/
      conversations.ts
      messages.ts
      assistants.ts
      profile.ts
    server/                    # chat route + optional RSC
  services/
    browser/
      conversation-session.ts  # replaces fetch-conversation-session.ts
      create-conversation.ts
      assistants.ts
      profile.ts
    server/
      chat.ts
  api/
    chat-client.ts             # only consumer of POST /api/chat
  validation/
    assistant.ts
    profile.ts
  supabase/
    client.ts
    server.ts
```

---

## 5. Decision tree (for agents & devs)

```
Need to read/write data?
├─ Uses LLM / streaming / third-party secret? → server API (/api/chat)
├─ Multi-step must be atomic? → Supabase RPC (preferred) or temporary BFF
├─ Single-table or RLS-covered CRUD? → lib/data/browser + lib/services/browser
└─ RSC first paint only? → lib/data/server (optional, do not duplicate BFF)
```

---

## 6. Database (RPC / constraints)

Migration file (planned): `supabase/migrations/20260618000000_iter04_data_access_rpc.sql`

### 6.1 `create_conversation_with_opening(p_assistant_id uuid)`

1. Verify `assistants.user_id = auth.uid()`
2. Insert `conversations`
3. If `assistants.opening_message` not empty → insert `messages` role `assistant`
4. Return `conversation_id`

### 6.2 `ensure_user_assistants()`

- If user has zero assistants → clone platform template (`user_id IS NULL`, `is_default`)
- Return set of user assistant rows (or void + client re-list)

### 6.3 `delete_assistant(p_assistant_id uuid)` (optional)

- If conversations exist → raise `assistant_in_use`
- Else delete

### 6.4 Constraints

- `user_profiles.nickname` length CHECK
- `assistants.name` length CHECK (align with app validation)

---

## 7. BFF migration map

| Current route | iter-04 | Action |
|---------------|---------|--------|
| `GET /api/conversations` | `data.browser.conversations.list()` | **Removed** |
| `GET /api/conversations/[id]/session` | `services.browser.loadConversationSession()` | **Removed** |
| `POST /api/conversations` | RPC `create_conversation_with_opening` | **Removed** |
| `DELETE /api/conversations/[id]` | `data.browser.conversations.remove()` | **Removed** |
| `DELETE /api/conversations/[id]/messages` | `data.browser.messages.clear()` | **Removed** |
| `GET/POST /api/assistants` | `data.browser.assistants` + RPC ensure | **Removed** |
| `PATCH/DELETE /api/assistants/[id]` | `data.browser.assistants` + delete RPC | **Removed** |
| `GET/PATCH /api/profile` | `data.browser.profile` | **Removed** |
| **`POST /api/chat`** | **Keep** | No change |

---

## 8. Component migration checklist

| Component | Before | After |
|-----------|--------|-------|
| `chat-app-shell.tsx` | `fetch('/api/...')` | `services.browser.*` ✓ |
| `assistants-manager.tsx` | `fetch('/api/assistants')` | service ✓ |
| `profile-form.tsx` | `fetch('/api/profile')` | service ✓ |
| `assistant-picker-dialog.tsx` | `fetch('/api/assistants')` | shared list ✓ |
| `chat-conversation-panel.tsx` | fetch clear | `clearChat` service ✓ |
| `chat-conversation-panel.tsx` | `useChat` → `/api/chat` | **unchanged** ✓ |

---

## 9. Model label (browser)

Replace server `getLlmDisplayLabel()` for UI-only display:

```typescript
// lib/services/browser/model-label.ts
import { getModelOptionsForProvider, getPublicLlmProviderId } from '@/lib/constants/model-options';

export function getDisplayModelLabel(preferredModel?: string | null): string {
  const provider = getPublicLlmProviderId(); // from NEXT_PUBLIC_LLM_PROVIDER
  const model = preferredModel ?? getDefaultModelForProvider(provider);
  return `${model} (${provider})`;
}
```

Add `NEXT_PUBLIC_LLM_PROVIDER` mirroring server `LLM_PROVIDER` (document in `.env.example`).

---

## 10. Error handling

- **Data layer:** throw `SupabaseError` with `code` + `message`
- **Service layer:** map to user-facing English strings (same as today)
- **Components:** show inline error / toast; no raw PostgREST text

---

## 11. Security checklist

- [x] All browser writes go through RLS (no `service_role` in client)
- [x] RPC uses `auth.uid()` internally
- [x] No LLM keys in `NEXT_PUBLIC_*`
- [x] Chat route still calls `getUser()` before stream

---

## 12. Testing plan

- [x] Switch conversation: no `/session` BFF (E2E AC-30)
- [x] New chat with opening message (unit AC-33)
- [x] Delete assistant with chats: error (RPC)
- [x] Profile nickname/model save (E2E AC-31)
- [x] Send message hits `/api/chat` only (E2E AC-34)
- [x] `pnpm build`

---

## 13. PRD AC mapping

| AC | Implementation |
|----|----------------|
| AC-30 | Remove session route; shell uses service |
| AC-31 | profile service + data |
| AC-32 | assistants service + data |
| AC-33 | RPC create conversation |
| AC-34 | Only chat route imports `lib/llm/provider` secrets |

---

## 14. Revision history

| Date | Version | Change |
|------|---------|--------|
| 2026-06-16 | v0.1 | iter-04 initial design |
| 2026-06-17 | v1.0 | Implemented; BFF removed; RPC applied |
