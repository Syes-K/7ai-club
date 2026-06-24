# agent-orchestration — Feature overview

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Feature slug:** `agent-orchestration`  
> **Iteration:** [`iter-06`](../../iterations/iter-06/README.md) (**Released** — 2026-06-24)  
> **Roadmap phase:** 2 — Agent orchestration foundation (enables RAG / MCP / Skills)

---

## Document map (agent entry)

**iter-06 released — read changelog first, then sub-PRDs:**

1. [01-product-requirements.md](./01-product-requirements.md) — index §2 global conventions  
2. [changelog/iter-06.md](./changelog/iter-06.md) — **iter-06 AC-50–64**  
3. Sub-PRDs: [workflow-orchestration.md](./prd/workflow-orchestration.md) · [stream-resume.md](./prd/stream-resume.md)

| Layer | Index | Sub-docs |
|-------|-------|----------|
| Product | [01-product-requirements.md](./01-product-requirements.md) | [prd/](./prd/) |
| Technical | [02-technical-design.md](./02-technical-design.md) | [design/workflow-orchestration.md](./design/workflow-orchestration.md) · [design/stream-resume.md](./design/stream-resume.md) |

**Related features:** [mvp-chat](../mvp-chat/README.md) (`/api/chat` refactor), [console](../console/README.md) (no UI changes)

---

## iter-06 scope summary

- **Workflow orchestration** — Vercel AI SDK + custom `WorkflowRunner` / nodes (no LangChain / LangGraph / n8n)  
- **Step visibility** — Real-time step timeline in Chat (running / success / error)  
- **Run logs** — Supabase `workflow_runs` + `workflow_step_logs`  
- **Stream resume** — Upstash Redis + AI SDK Resumable Stream; purge Redis after run completes or errors  
- **Out of scope** — RAG, MCP, Skills, visual workflow editor

---

*Layering:* [docs/README.md](../../README.md)
