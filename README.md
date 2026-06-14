# 7ai-club

[中文](README.cn.md)

A chat-first web platform for configurable AI assistants. Users can create assistants, chat with streaming responses, and configure per-assistant system prompts, knowledge bases, and MCP tools.

**Status:** iter-01 MVP chat is implemented (Next.js + Supabase Auth + SiliconFlow streaming chat).

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js App Router + Tailwind |
| Admin UI | shadcn/ui |
| Data | Supabase (Auth, PostgreSQL, pgvector, Storage) |
| Auth | Supabase Auth JWT + `@supabase/ssr` |
| AI orchestration | Vercel AI SDK (`ToolLoopAgent`, `streamText`) |
| MCP (runtime) | `@ai-sdk/mcp` (HTTP/SSE) |
| Deployment | Vercel |

See [`docs/research/ai-agent-platform-architecture.md`](docs/research/ai-agent-platform-architecture.md) for architecture decisions (Chinese: [`ai-agent-platform-architecture-cn.md`](docs/research/ai-agent-platform-architecture-cn.md)).

---

## Repository Layout

```
docs/
  research/            # Architecture research (read-only reference)
  features/<slug>/     # Feature PRD + technical design
  iterations/<id>/     # Iteration planning and release index

.cursor/
  agents/              # Custom subagents
  rules/               # Workflow gates
  skills/              # Architecture, PRD, UI skills and templates
  mcp.json             # Project MCP (Supabase)
```

---

## Documentation Conventions

See [`docs/README.md`](docs/README.md) (Chinese: [`docs/README-cn.md`](docs/README-cn.md)).

| Type | Path |
|------|------|
| PRD | `docs/features/<slug>/01-product-requirements.md` + `01-product-requirements-cn.md` |
| Technical design | `docs/features/<slug>/02-technical-design.md` + `02-technical-design-cn.md` |
| Iteration index | `docs/iterations/<iter-id>/README.md` + `README-cn.md` |

**Principle:** Feature folders hold living requirements and design docs. Iteration folders track time-boxed goals only. **`docs/` pairs English and Chinese files like `research/`.**

---

## Cursor Development Workflow

This project uses a two-stage subagent flow with human confirmation gates:

| Stage | Subagent | Output |
|-------|----------|--------|
| 1 | `product-analyst` | PRD |
| 2 | `fullstack-developer` | Technical design → implementation |

**Confirmation phrases:**

- PRD: `PRD 已确认，可进入技术设计` (PRD confirmed; proceed to technical design)
- Technical design: `技术设计已确认，可开始编码` (Technical design confirmed; start coding)

**Example prompts:**

```
Use product-analyst for MVP chat, slug: mvp-chat, iteration: iter-01
```

```
Use fullstack-developer to read docs/features/mvp-chat/01-product-requirements.md and produce technical design first
```

See `.cursor/rules/7ai-club-workflow.mdc` for full workflow rules.

---

## Implementation Roadmap

| Phase | Scope |
|-------|--------|
| 1 — MVP chat | Auth, assistant CRUD, streaming chat API + UI |
| 2 — Knowledge base | pgvector, document ingestion, RAG |
| 3 — Agent | `ToolLoopAgent`, custom tools, conversation memory |
| 4 — MCP | Assistant ↔ MCP binding, credential management |
| 5 — Production hardening | Rate limits, RLS audit, observability |

---

## Local Development

```bash
pnpm install
cp .env.example .env.local   # Supabase + LLM provider keys
```

**Database:** Run `supabase/migrations/20260614000000_mvp_chat.sql` on your Supabase project (or `supabase db push` with the CLI).

```bash
pnpm dev     # http://localhost:3000
pnpm build   # production build check
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `LLM_PROVIDER` | `siliconflow` or `nvidia` (default: `siliconflow`) |
| `LLM_MODEL` | Optional model override |
| `SILICONFLOW_API_KEY` | SiliconFlow API key (when `LLM_PROVIDER=siliconflow`) |
| `SILICONFLOW_BASE_URL` | Optional; default `https://api.siliconflow.cn/v1` |
| `NVIDIA_API_KEY` | NVIDIA NIM API key (when `LLM_PROVIDER=nvidia`) |
| `NVIDIA_BASE_URL` | Optional; default `https://integrate.api.nvidia.com/v1` |

---

## MCP (Cursor IDE)

This repo includes [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp). Copy and set your project ref:

```bash
cp .cursor/mcp.json.example .cursor/mcp.json
```

Enable `supabase` under Cursor Settings → MCP and complete OAuth. Prefer a URL with `project_ref` and `read_only=true`.

Optional for development: Context7 (library docs), Playwright (E2E).

---

## License

See [LICENSE](LICENSE).
