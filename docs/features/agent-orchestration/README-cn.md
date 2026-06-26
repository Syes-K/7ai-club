# agent-orchestration — 功能概览

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **Feature slug：** `agent-orchestration`  
> **迭代：** [`iter-06`](../../iterations/iter-06/README-cn.md)（**已发布**）· [`iter-07`](../../iterations/iter-07/README-cn.md)（**已发布**）· [`iter-08`](../../iterations/iter-08/README-cn.md)（**已发布**）  
> **路线图阶段：** 2 — Agent 编排基础（为 RAG / MCP / Skills 铺路）

---

## 文档地图（Agent 入口）

**iter-08 已发布 — 验收：** [changelog/iter-08-cn.md](./changelog/iter-08-cn.md) · AC-80–89

**iter-07 已发布 —** [changelog/iter-07-cn.md](./changelog/iter-07-cn.md) · AC-70–77

**iter-06（已发布）：** [changelog/iter-06-cn.md](./changelog/iter-06-cn.md) · AC-50–64

| 层级 | 总纲 | 子文档 |
|------|------|--------|
| 产品 | [01-product-requirements-cn.md](./01-product-requirements-cn.md) | [prd/](./prd/) |
| 技术 | [02-technical-design-cn.md](./02-technical-design-cn.md) | [design/workflow-orchestration-cn.md](./design/workflow-orchestration-cn.md) · [design/stream-resume-cn.md](./design/stream-resume-cn.md) |

**关联 feature：** [mvp-chat](../mvp-chat/README-cn.md)（Clear chat 扩展）、[console](../console/README-cn.md)（Preferences 摘要配置）

---

## iter-08 范围摘要（已发布）

- **默认折叠步骤面板** — 折叠头当前步骤 / `N steps completed`；chevron affordance  
- **Registry 架构** — `components/chat/workflow/`；Reasoning 流式；Markdown 摘要 detail  
- **DB / API** — `workflow_step_logs` 扩展（detail、skipped、kind）；workflow restore  
- **Reasoning / 模型 Test** — capability 检测；connectivity-test；openai-compatible 客户端  
- **步骤行 UX** — Reasoning / Summarizing 标题与 chevron 同行；token 统计折叠内展示  
- **验收** — [changelog/iter-08-cn.md](./changelog/iter-08-cn.md) · AC-80–89 · `iter08-manual-qa.spec.ts`  

---

## iter-07 范围摘要（已发布）

- **滚动摘要** — 超阈值压缩；软归档（含 RLS 补丁）；Preferences 可配置  
- **Workflow Nodes** — 7 步链路；刷新后多 turn 恢复；run ↔ user 时间窗口匹配  
- **步骤 UI** — inline 展开；Load context 显示 `active · total`  
- **Clear chat** — 一并清除 memory summary  
- **人工 QA 记录** — [changelog §7–§10](./changelog/iter-07-cn.md)  

---

## iter-06 范围摘要（已发布）

- **Workflow 编排** — Vercel AI SDK + 自建 `WorkflowRunner` / Node（不用 LangChain / LangGraph / n8n）  
- **步骤可见性** — Chat 内实时步骤时间线（running / success / error）  
- **运行日志** — Supabase `workflow_runs` + `workflow_step_logs`  
- **流式恢复** — Upstash Redis + AI SDK Resumable Stream；run 结束或异常后清理 Redis  
- **Out of Scope** — RAG、MCP、Skills、可视化编辑器

---

*分层说明：* [docs/README-cn.md](../../README-cn.md)
