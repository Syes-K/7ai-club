# agent-orchestration — 功能概览

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **Feature slug：** `agent-orchestration`  
> **迭代：** [`iter-06`](../../iterations/iter-06/README-cn.md)（**已发布** — 2026-06-24）  
> **路线图阶段：** 2 — Agent 编排基础（为 RAG / MCP / Skills 铺路）

---

## 文档地图（Agent 入口）

**iter-06 已发布 — 先读 changelog，再读子 PRD：**

1. [01-product-requirements-cn.md](./01-product-requirements-cn.md) — 总纲 §2 全局约定  
2. [changelog/iter-06-cn.md](./changelog/iter-06-cn.md) — **iter-06 AC-50–64**  
3. 子 PRD：[workflow-orchestration-cn.md](./prd/workflow-orchestration-cn.md) · [stream-resume-cn.md](./prd/stream-resume-cn.md)

| 层级 | 总纲 | 子文档 |
|------|------|--------|
| 产品 | [01-product-requirements-cn.md](./01-product-requirements-cn.md) | [prd/](./prd/) |
| 技术 | [02-technical-design-cn.md](./02-technical-design-cn.md) | [design/workflow-orchestration-cn.md](./design/workflow-orchestration-cn.md) · [design/stream-resume-cn.md](./design/stream-resume-cn.md) |

**关联 feature：** [mvp-chat](../mvp-chat/README-cn.md)（`/api/chat` 重构）、[console](../console/README-cn.md)（无 UI 变更）

---

## iter-06 范围摘要

- **Workflow 编排** — Vercel AI SDK + 自建 `WorkflowRunner` / Node（不用 LangChain / LangGraph / n8n）  
- **步骤可见性** — Chat 内实时步骤时间线（running / success / error）  
- **运行日志** — Supabase `workflow_runs` + `workflow_step_logs`  
- **流式恢复** — Upstash Redis + AI SDK Resumable Stream；run 结束或异常后清理 Redis  
- **Out of Scope** — RAG、MCP、Skills、可视化编辑器

---

*分层说明：* [docs/README-cn.md](../../README-cn.md)
