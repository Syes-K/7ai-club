# iter-01 — MVP Chat

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **Iteration ID:** `iter-01`  
> **Status:** In progress  
> **Roadmap phase:** 1 — MVP Chat  
> **Planned release:** —  
> **Actual release:** —  
> **Git tag (optional):** `v0.1.0`

---

## 1. Iteration goals

- Stand up the Next.js + Supabase Auth + Vercel AI SDK stack
- Deliver a minimal AI chat loop: sign up / sign in → streaming chat → persisted history
- Validate SiliconFlow (OpenAI-compatible) + `Qwen/Qwen2.5-7B-Instruct` integration

---

## 2. Scope

### In scope

- Next.js App Router scaffold, Tailwind, shadcn/ui basics
- Supabase Auth (email/password), middleware, RLS
- Fixed default assistant, conversations and messages tables
- Streaming Chat API (SiliconFlow) + chat UI (dark theme)
- Conversation history list, new conversation, continue chat

### Out of scope (not in this iteration)

- Assistant CRUD, system prompt editing UI
- Knowledge base / RAG, MCP, multi-step agents
- Multi-model switching, OAuth / Magic Link
- Rate limiting, observability, production hardening

---

## 3. Features in this iteration

| Feature slug | PRD | Technical design | Priority | Iteration status |
|--------------|-----|------------------|----------|------------------|
| `mvp-chat` | [01-product-requirements.md](../../features/mvp-chat/01-product-requirements.md) · [01-product-requirements-cn.md](../../features/mvp-chat/01-product-requirements-cn.md) | [02-technical-design.md](../../features/mvp-chat/02-technical-design.md) · [02-technical-design-cn.md](../../features/mvp-chat/02-technical-design-cn.md) | P0 | Development complete |

Path convention: documents live under `docs/features/<slug>/`. **Do not** duplicate PRD or design bodies inside the iteration folder.

---

## 4. Iteration acceptance criteria

- [ ] Local `next dev` supports sign up → sign in → streaming chat → history persists after refresh
- [ ] Supabase RLS isolates conversations per user
- [ ] `.env.example` documents required Supabase and SiliconFlow variables
- [ ] Vercel deployment is accessible (or deployment steps are documented)

---

## 5. Dependencies and risks

| Item | Notes |
|------|-------|
| Dependencies | Supabase project, SiliconFlow API key, Vercel account |
| Risks | SiliconFlow availability and latency; mitigation: friendly error states, fetch timeout in technical design |

---

## 6. Release log

| Date | Event | Notes |
|------|-------|-------|
| 2026-06-14 | Iteration kickoff | PRD alignment complete |

---

## 7. Revision log

| Date | Change |
|------|--------|
| 2026-06-14 | Created iter-01 |
