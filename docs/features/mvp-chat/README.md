# mvp-chat — Feature Overview

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **Feature slug:** `mvp-chat`  
> **Iteration:** [`iter-01`](../../iterations/iter-01/README.md)  
> **Roadmap phase:** 1 — MVP Chat  
> **Status:** Local iteration complete · Production deploy in progress

---

## Documents

| Type | English | 中文 |
|------|---------|------|
| PRD | [01-product-requirements.md](./01-product-requirements.md) | [01-product-requirements-cn.md](./01-product-requirements-cn.md) |
| Technical design | [02-technical-design.md](./02-technical-design.md) | [02-technical-design-cn.md](./02-technical-design-cn.md) |

---

## What shipped (iter-01)

- Next.js App Router app: auth, streaming chat UI, conversation history
- Supabase Auth + RLS + migration `supabase/migrations/20260614000000_mvp_chat.sql`
- Chat API `POST /api/chat` with Vercel AI SDK `streamText` + `useChat`
- Switchable LLM providers via env (`lib/llm/provider.ts`):
  - `siliconflow` — OpenAI-compatible
  - `nvidia` — NVIDIA NIM (`@ai-sdk/openai-compatible`)
  - `bailian` — Alibaba Bailian / DashScope (default model `qwen3.6-plus`)
- LLM timeouts (default 120s) + Vercel function `maxDuration` 130s
- English UI + English DB seed copy

---

## Implementation notes (beyond original PRD)

| Topic | PRD (v0.1) | Implemented |
|-------|------------|-------------|
| LLM provider | SiliconFlow only | Env-switchable: SiliconFlow / NVIDIA / Bailian |
| Default model | `Qwen/Qwen2.5-7B-Instruct` | Provider-specific default; override via `LLM_MODEL` |
| Chat timeout | `maxDuration = 300` | `maxDuration = 130`, `LLM_TIMEOUT_MS = 120000` |

These extensions are documented in [iter-01 release log](../../iterations/iter-01/README.md#6-release-log). PRD revision deferred to a later pass if product scope is formally expanded.

---

## Local quick start

```bash
pnpm install
cp .env.example .env.local   # Supabase + LLM keys
# Apply supabase/migrations/20260614000000_mvp_chat.sql on your project
pnpm dev
```

See root [README.md](../../../README.md) for full environment variable list.

---

## Known gaps (post local iteration)

- Vercel production: NVIDIA NIM may hang or timeout; prefer `bailian` or `siliconflow` on deploy until resolved
- PRD AC-09 (fixed Qwen model) superseded by multi-provider design
- Assistant CRUD, RAG, MCP — out of scope for iter-01

---

*Iteration index: [docs/iterations/iter-01/README.md](../../iterations/iter-01/README.md)*
