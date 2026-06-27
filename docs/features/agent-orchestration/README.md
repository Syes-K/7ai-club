# agent-orchestration — Feature overview

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Feature slug:** `agent-orchestration`  
> **Iteration:** [`iter-06`](../../iterations/iter-06/README.md) (**Released**) · [`iter-07`](../../iterations/iter-07/README.md) (**Released**) · [`iter-08`](../../iterations/iter-08/README.md) (**Released**)  
> **Roadmap phase:** 2 — Agent orchestration foundation (enables RAG / MCP / Skills)

---

## Document map (agent entry)

**iter-08 released:** [changelog/iter-08.md](./changelog/iter-08.md) · AC-80–89

**iter-07 released:** [changelog/iter-07.md](./changelog/iter-07.md) · AC-70–77

**iter-06 (released):** [changelog/iter-06.md](./changelog/iter-06.md) · AC-50–64

| Layer | Index | Sub-docs |
|-------|-------|----------|
| Product | [01-product-requirements.md](./01-product-requirements.md) | [prd/](./prd/) |
| Technical | [02-technical-design.md](./02-technical-design.md) | [design/workflow-orchestration.md](./design/workflow-orchestration.md) · [design/stream-resume.md](./design/stream-resume.md) |

**Related features:** [mvp-chat](../mvp-chat/README.md) (Clear chat extension), [console](../console/README.md) (Preferences summarization)

---

## iter-08 scope summary (released)

Default-collapsed panel; registry + Reasoning stream; Markdown summary detail; DB/API extensions; inline step chevrons (B-04). Post-release: Reasoning buffer, workflow poll dedup, turn memo, LLM streaming MD. **Released** 2026-06-26. See [changelog/iter-08.md](./changelog/iter-08.md).

---

## iter-07 scope summary (released)

See [README-cn.md](./README-cn.md) § iter-07 — rolling summary, 7-step workflow restore, `active · total` load context, changelog §7–§10. **Released** 2026-06-26.  

---

## iter-06 scope summary (released)

- **Workflow orchestration** — Vercel AI SDK + custom `WorkflowRunner` / nodes (no LangChain / LangGraph / n8n)  
- **Step visibility** — Real-time step timeline in Chat (running / success / error)  
- **Run logs** — Supabase `workflow_runs` + `workflow_step_logs`  
- **Stream resume** — Upstash Redis + AI SDK Resumable Stream; purge Redis after run completes or errors  
- **Out of scope** — RAG, MCP, Skills, visual workflow editor

---

*Layering:* [docs/README.md](../../README.md)
