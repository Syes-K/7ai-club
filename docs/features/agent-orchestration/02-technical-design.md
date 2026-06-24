# Agent orchestration — Technical design index

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文:** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `agent-orchestration`  
> **Roadmap phase:** 2 — Agent orchestration foundation  
> **PRD:** [01-product-requirements.md](./01-product-requirements.md)  
> **Status:** iter-06 **draft — pending confirmation**  
> **Date:** 2026-06-24  
> **Version:** v0.1

---

## 1. Summary

iter-06 introduces **WorkflowRunner** on `POST /api/chat` (Vercel AI SDK `createUIMessageStream`), four linear nodes, `data-workflow-step` events, Supabase run/step logs, and **Upstash Redis** resumable streams with post-run purge. No LangChain / LangGraph.

**Required reading:**

1. [changelog/iter-06.md](./changelog/iter-06.md)  
2. [design/workflow-orchestration.md](./design/workflow-orchestration.md)  
3. [design/stream-resume.md](./design/stream-resume.md)

See [02-technical-design-cn.md](./02-technical-design-cn.md) for architecture table, API list, env vars, file index, and implementation order.

---

## 2. Revision history

| Date | Version | Change |
|------|---------|--------|
| 2026-06-24 | v0.1 | iter-06 technical design draft |

---

*After review, reply: `技术设计已确认，可开始编码`*
