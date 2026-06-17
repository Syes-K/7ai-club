# iter-04 Changelog — hybrid data access

> **English:** [iter-04.md](./iter-04.md)  
> **中文:** [iter-04-cn.md](./iter-04-cn.md)  
> **Iteration:** [iter-04/README.md](../../iterations/iter-04/README.md)

---

## 1. Theme

| Topic | PRD | Design |
|-------|-----|--------|
| Hybrid browser data access | [prd/data-access.md](../prd/data-access.md) | [design/data-access.md](../design/data-access.md) |

Affects **mvp-chat** + **console** (shared `lib/data/browser`).

---

## 2. Required reading

1. [design/data-access.md](../design/data-access.md)
2. [prd/data-access.md](../prd/data-access.md)

---

## 3. Delivered code changes

### 3.1 Added

```
lib/data/types.ts
lib/data/errors.ts
lib/data/browser/{conversations,messages,assistants,profile}.ts
lib/services/browser/{conversation-session,assistants,profile,clear-chat,model-label}.ts
lib/api/chat-client.ts
lib/validation/{assistant,profile}.ts
lib/auth/redirect.ts
app/auth/callback/route.ts
supabase/migrations/20260618000000_iter04_data_access_rpc.sql
tests/unit/*.test.ts (6 files, 21 cases)
tests/e2e/iter04-data-access.spec.ts
```

### 3.2 Removed BFF (`app/api/` keeps chat only)

```
app/api/conversations/route.ts
app/api/conversations/[id]/route.ts
app/api/conversations/[id]/session/route.ts
app/api/conversations/[id]/messages/route.ts
app/api/assistants/route.ts
app/api/assistants/[id]/route.ts
app/api/profile/route.ts
lib/chat/fetch-conversation-session.ts
```

### 3.3 Kept

```
app/api/chat/route.ts
lib/llm/*
lib/supabase/server.ts   # chat + RSC auth
```

### 3.4 Component migration (BFF fetch → browser service)

| Component | Change |
|-----------|--------|
| `chat-app-shell.tsx` | `services.browser.*`; switch loads messages only |
| `chat-conversation-panel.tsx` | clear-chat service; chat still `/api/chat` |
| `assistant-picker-dialog.tsx` | `listAssistantOptions` |
| `assistants-manager.tsx` | assistants service + validation |
| `profile-form.tsx` | profile service; submit changed fields only |
| `app/chat/layout.tsx` | inject `preferredModel` |
| `app/console/profile/page.tsx` | server `initialProfile` |

### 3.5 DB RPC (applied on remote)

- `create_conversation_with_opening`
- `ensure_user_assistants`
- `delete_assistant_if_unused`
- nickname / assistant name CHECK constraints

### 3.6 Bundled fixes (same release)

| Item | Notes |
|------|-------|
| Sign-up email redirect | `emailRedirectTo` + `/auth/callback` + middleware |
| Profile save | empty patch shows Saved; partial patch avoids Invalid model |
| E2E cleanup | `afterEach` deletes conversations created in that test |

---

## 4. Acceptance checklist

- [x] **AC-30** — No `/session` BFF on chat switch
- [x] **AC-31** — Profile via browser layer
- [x] **AC-32** — Assistants via browser layer
- [x] **AC-33** — Opening message on create (RPC)
- [x] **AC-34** — Only `/api/chat` uses LLM secrets
- [x] No component imports `@/lib/supabase/client` directly

---

## 5. Manual QA

| # | Scenario | E2E | Manual |
|---|----------|-----|--------|
| 1 | Switch chats — Supabase only, no session API | AC-30 | [x] |
| 2 | New chat with opening message | AC-33 unit | [x] |
| 3 | Console profile + assistants CRUD | AC-31/32 | [x] |
| 4 | Send message — only `/api/chat` | AC-34 | [x] |
| 5 | Delete assistant with chats — error | RPC unit | [x] |
| 6 | Sign-up confirmation link (prod domain) | — | [x] |

---

## 6. Automated tests

| AC | Test files |
|----|------------|
| AC-30 | `tests/unit/conversation-session.test.ts`, `tests/e2e/iter04-data-access.spec.ts` |
| AC-31 | `tests/unit/profile-validation.test.ts`, `tests/e2e/iter04-data-access.spec.ts` |
| AC-32 | `tests/unit/assistant-validation.test.ts`, `tests/unit/assistants-service.test.ts`, `tests/e2e/iter04-data-access.spec.ts` |
| AC-33 | `tests/unit/create-conversation.test.ts` |
| AC-34 | `tests/unit/iter04-architecture.test.ts`, `tests/e2e/iter04-data-access.spec.ts` |
| No direct Supabase in components | `tests/unit/iter04-architecture.test.ts` |

```bash
pnpm lint && pnpm build && pnpm test
pnpm test:e2e --workers=1    # needs E2E_TEST_EMAIL/PASSWORD in .env.local
pnpm test:ci
```

**E2E setup:** `pnpm exec playwright install chromium`

**2026-06-17:** lint ✓ · build ✓ · unit 21/21 ✓ · e2e 6/6 ✓ (local, creds configured)

---

## 7. Revision history

| Date | Change |
|------|--------|
| 2026-06-16 | Created iter-04 changelog |
| 2026-06-17 | Implementation complete; AC checked; test results documented |
| 2026-06-17 | Manual QA done; **shipped** |
