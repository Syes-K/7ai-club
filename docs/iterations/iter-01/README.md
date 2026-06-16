# iter-01 — MVP Chat

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **Iteration ID:** `iter-01`  
> **Status:** Local iteration complete  
> **Roadmap phase:** 1 — MVP Chat  
> **Planned release:** —  
> **Local sign-off:** 2026-06-14  
> **Production deploy:** In progress (`7ai-club.vercel.app`)  
> **Git tag (optional):** `v0.1.0`

---

## 1. Iteration goals

- [x] Stand up Next.js + Supabase Auth + Vercel AI SDK stack
- [x] Deliver minimal AI chat loop: sign up / sign in → streaming chat → persisted history
- [x] Validate OpenAI-compatible LLM integration (SiliconFlow, NVIDIA NIM, Alibaba Bailian)

---

## 2. Scope

### In scope (delivered)

- Next.js App Router scaffold, Tailwind, shadcn/ui basics
- Supabase Auth (email/password), middleware, RLS
- Fixed default assistant, `conversations` + `messages` tables
- Streaming Chat API + chat UI (dark theme, English copy)
- Conversation history list, new conversation, continue chat
- Env-switchable LLM providers (`lib/llm/provider.ts`)
- LLM request timeouts + clearer Vercel deploy error messages

### Out of scope (deferred)

- Assistant CRUD, system prompt editing UI
- Knowledge base / RAG, MCP, multi-step agents
- In-app model switching UI (env-only for now)
- OAuth / Magic Link
- Rate limiting, observability, production hardening

---

## 3. Features in this iteration

| Feature slug | PRD | Technical design | Priority | Status |
|--------------|-----|------------------|----------|--------|
| `mvp-chat` | [01-product-requirements.md](../../features/mvp-chat/01-product-requirements.md) · [01-product-requirements-cn.md](../../features/mvp-chat/01-product-requirements-cn.md) | [02-technical-design.md](../../features/mvp-chat/02-technical-design.md) · [02-technical-design-cn.md](../../features/mvp-chat/02-technical-design-cn.md) | P0 | Local complete |

Feature overview: [docs/features/mvp-chat/README.md](../../features/mvp-chat/README.md)

---

## 4. Iteration acceptance criteria

### Local development (verified)

- [x] `pnpm dev`: register → sign in → streaming chat → history persists after refresh
- [x] Supabase RLS isolates conversations per user
- [x] `.env.example` documents Supabase + multi-provider LLM variables
- [x] LLM failure shows readable error in chat UI (not blank screen)

### Production / Vercel (partial)

- [x] App deploys to Vercel; auth and chat pages load
- [ ] Streaming chat stable on production for chosen provider (NVIDIA NIM hung → use Bailian/SiliconFlow + redeploy with env)

### PRD AC mapping (local)

| ID | Criterion | Local |
|----|-----------|-------|
| AC-01 | `/chat` requires auth | Pass |
| AC-02 | Register auto sign-in → `/chat` | Pass |
| AC-03 | Streaming AI replies | Pass |
| AC-04 | Refresh restores messages | Pass |
| AC-05 | Sidebar history + switch | Pass |
| AC-06 | New empty conversation | Pass |
| AC-07 | LLM error UI | Pass |
| AC-08 | RLS user isolation | Pass (by design; manual two-account test recommended) |
| AC-09 | Fixed Qwen via SiliconFlow | **Superseded** — multi-provider via `LLM_PROVIDER` / `LLM_MODEL` |

---

## 5. Local development checklist

```bash
pnpm install
cp .env.example .env.local
```

1. Fill `NEXT_PUBLIC_SUPABASE_*` and one LLM provider key (e.g. `BAILIAN_API_KEY` + `LLM_PROVIDER=bailian`)
2. Apply `supabase/migrations/20260614000000_mvp_chat.sql`
3. `pnpm dev` → http://localhost:3000
4. Register → chat → refresh → confirm history

**Recommended local provider:** `bailian` + `qwen3.6-plus` (or `siliconflow`)

**Timeout defaults:** `LLM_TIMEOUT_MS=120000`, `/api/chat` `maxDuration=130`

---

## 6. Dependencies and risks

| Item | Notes |
|------|-------|
| Dependencies | Supabase project, LLM API key (Bailian / SiliconFlow / NVIDIA), Vercel for deploy |
| Resolved locally | Auth, streaming, persistence, multi-provider abstraction |
| Open risk | NVIDIA NIM on Vercel: stream may hang until platform timeout; mitigated with LLM timeout + provider switch |
| Open risk | Supabase Auth on Vercel: add Site URL + Redirect URLs for production domain |

---

## 7. Release log

| Date | Event | Notes |
|------|------|-------|
| 2026-06-14 | Iteration kickoff | PRD + technical design confirmed |
| 2026-06-14 | MVP scaffold | `ec34046` — auth, chat UI, SiliconFlow/NVIDIA providers |
| 2026-06-14 | Vercel deploy fixes | `8ae8e7a` — env validation, error messages, `vercel.json` |
| 2026-06-14 | Bailian + timeouts | `5c4a91e` — Bailian provider, 120s LLM timeout |
| 2026-06-14 | **Local iteration complete** | Local E2E pass; production LLM provider TBD |

---

## 8. Next steps (post iter-01 local)

1. Vercel: set `LLM_PROVIDER=bailian`, `BAILIAN_API_KEY`, `LLM_TIMEOUT_MS=120000` → Redeploy
2. Supabase Auth: add `https://7ai-club.vercel.app` to Site URL / Redirect URLs
3. Optional: git tag `v0.1.0` after production chat verified
4. **iter-02** (backlog created): Bailian abort fix + LLM error UX — see [iter-02/README.md](../iter-02/README.md)

---

## 9. Revision log

| Date | Change |
|------|--------|
| 2026-06-14 | Created iter-01 |
| 2026-06-14 | Local iteration wrap-up: status, AC, release log, feature README link |
