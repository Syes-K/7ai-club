# 7ai-club

[中文](README.cn.md)

A chat-first web platform for configurable AI assistants — streaming chat, knowledge-base RAG, console management, and workflow observability.

| | |
|---|---|
| **Production** | [https://7ai-club.vercel.app](https://7ai-club.vercel.app) |
| **Local dev** | [http://localhost:3000](http://localhost:3000) |
| **Latest release** | [iter-11](docs/iterations/iter-11/README.md) — Vercel Analytics & Speed Insights ([cn](docs/iterations/iter-11/README-cn.md)) |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js App Router + Tailwind |
| Console UI | shadcn/ui |
| Data | Supabase (Auth, PostgreSQL, pgvector, Storage) |
| Auth | Supabase Auth JWT + `@supabase/ssr` |
| AI | Vercel AI SDK (`ToolLoopAgent`, `streamText`, RAG workflow) |
| Observability | Vercel Web Analytics + Speed Insights |
| Deployment | Vercel |

Architecture: [`docs/research/ai-agent-platform-architecture.md`](docs/research/ai-agent-platform-architecture.md) · [中文](docs/research/ai-agent-platform-architecture-cn.md)

---

## Documentation

| Type | Path |
|------|------|
| Index | [`docs/README.md`](docs/README.md) · [中文](docs/README-cn.md) |
| Feature PRD / design | `docs/features/<slug>/` |
| Iteration releases | `docs/iterations/<iter-id>/` |

**Convention:** Feature docs are living; iteration folders are time-boxed release indexes. English and Chinese files are maintained in pairs (`*.md` + `*-cn.md`).

### Cursor workflow

Three subagents with gated phases: **PRD → technical design → implementation → QA**.

| Stage | Subagent |
|-------|----------|
| Requirements | `product-analyst` |
| Design + code | `fullstack-developer` |
| Test sign-off | `qa-engineer` |

Gate phrases and full rules: [`.cursor/rules/7ai-club-workflow.mdc`](.cursor/rules/7ai-club-workflow.mdc).

---

## Roadmap (phases)

| Phase | Scope |
|-------|--------|
| 1 — MVP chat | Auth, assistants, streaming chat |
| 2 — Knowledge base | pgvector, ingestion, RAG |
| 3 — Agent | Workflow steps, stream resume, memory |
| 4 — MCP | Assistant ↔ MCP binding |
| 5 — Production | Analytics, rate limits, hardening |

---

## Local Development

```bash
pnpm install
cp .env.example .env.local
pnpm dev          # http://localhost:3000
```

**Database:** Apply migrations under `supabase/migrations/` (e.g. `supabase db push`).

### Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright E2E (`CI=1` recommended locally) |
| `pnpm test:ci` | lint + build + unit + e2e |

### Key environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin (production: `https://7ai-club.vercel.app`). Used by `lib/site-url.ts`; optional locally (falls back to `window.location.origin` or `VERCEL_URL`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — encrypted API keys, admin ops |
| `LLM_ENCRYPTION_KEY` | Server only — AES-256-GCM for user LLM keys |
| `BAILIAN_API_KEY` | Platform default LLM (Alibaba Bailian / DashScope) |
| `UPSTASH_REDIS_*` | Stream resume (iter-06+); optional in local dev |

See [`.env.example`](.env.example) for the full list.

**Runtime site URL helper:** [`lib/site-url.ts`](lib/site-url.ts) (`getSiteUrl()`, `siteUrl(path)`).

---

## Deploying to Vercel

**Production site:** [https://7ai-club.vercel.app](https://7ai-club.vercel.app)

1. **Environment variables** — Vercel → Project → Settings → Environment Variables. At minimum for Production:

   | Variable | Production example |
   |----------|-------------------|
   | `NEXT_PUBLIC_SITE_URL` | `https://7ai-club.vercel.app` |
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role (server only) |
   | `LLM_ENCRYPTION_KEY` | `openssl rand -base64 32` |
   | `BAILIAN_API_KEY` | Platform LLM key |
   | `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Stream resume |

   Never prefix secrets with `NEXT_PUBLIC_`.

2. **Redeploy** after changing env vars.

3. **Supabase Auth** — Authentication → URL Configuration:

   - **Site URL:** `https://7ai-club.vercel.app`
   - **Redirect URLs:** `https://7ai-club.vercel.app/**`, `http://localhost:3000/**`

4. **Vercel Analytics** (iter-11) — Project → Settings → enable **Web Analytics** and **Speed Insights**, then redeploy.

5. **Function timeout** — Chat uses `maxDuration` up to plan limits; very slow models may need Pro or a faster model.

---

## MCP (Cursor IDE)

```bash
cp .cursor/mcp.json.example .cursor/mcp.json   # set project_ref
```

Enable **Supabase** MCP in Cursor Settings. Optional: Context7, Playwright.

---

## License

See [LICENSE](LICENSE).
