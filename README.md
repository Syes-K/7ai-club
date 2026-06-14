# 7ai-club

[中文](README.cn.md)

A chat-first web platform for configurable AI assistants. Users can create assistants, chat with streaming responses, and configure per-assistant system prompts, knowledge bases, and MCP tools.

**Status:** Architecture research and the Cursor development workflow are in place; application code has not been scaffolded yet.

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

| Type | Path |
|------|------|
| PRD | `docs/features/<slug>/01-product-requirements.md` |
| Technical design | `docs/features/<slug>/02-technical-design.md` |
| Iteration index | `docs/iterations/<iter-id>/README.md` |

**Principle:** Feature folders hold living requirements and design docs. Iteration folders only track time-boxed goals and which features ship—do not duplicate PRD bodies per iteration.

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

## Local Development (after scaffolding)

```bash
# Install and start commands will be added once the Next.js app is scaffolded
cp .env.example .env.local   # Supabase / LLM keys
```

Planned environment variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (never expose to the browser) |
| LLM-related | Per chosen provider |

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
