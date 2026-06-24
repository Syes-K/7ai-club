# Agent 编排 — 产品需求总纲

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **项目：** 7ai-club  
> **Feature slug：** `agent-orchestration`  
> **迭代：** `iter-06`（见 [iter-06 README](../../iterations/iter-06/README-cn.md)）  
> **路线图阶段：** 2 — Agent 编排基础  
> **状态：** **PRD 已确认**  
> **PRD 确认日期：** 2026-06-24  
> **文档版本：** v0.1

---

## 1. 执行摘要

在现有 MVP 聊天（iter-05）之上，引入 **可扩展的 Workflow 编排层**（Vercel AI SDK，不用 LangChain / LangGraph / n8n）：将 `/api/chat` 拆为可观测的 **Node 流水线**，运行中把每步 **状态 / 摘要 / 异常** 实时推到 Chat UI，并持久化到 Supabase 供排查。通过 **Upstash Redis** 实现流式回复在 **浏览器刷新后 resume**；每次对话 run **正常结束或异常后** 清理该 run 的 Redis 缓冲。本迭代 **不** 实现 RAG、MCP、Skills，仅为后续节点预留插槽。**用户可见 UI 文案为 English。**

---

## 2. 全局约定

### 2.1 路由（无新增页面）

| 路径 | 变更 |
|------|------|
| `/chat/[conversationId]` | 增加步骤时间线 UI（同页内） |
| `POST /api/chat` | 重构为 WorkflowRunner（行为对用户等价） |
| `GET /api/chat` 或 resume 端点 | 新增：刷新后恢复活跃流（技术设计定路径） |

### 2.2 编排技术选型（产品层已决）

| 项 | 选择 |
|----|------|
| 编排 | Vercel AI SDK `createUIMessageStream` + 自建 WorkflowRunner |
| 不采用 | LangChain、LangGraph、n8n（聊天路径） |
| 流式恢复存储 | **Upstash Redis** |
| 步骤 / run 日志 | **Supabase Postgres** |
| LLM 调用 | 保留现有 `lib/llm/provider.ts`、用户模型配置（iter-05） |

### 2.3 权限

| 操作 | 谁可以 |
|------|--------|
| 查看自己对话中的步骤时间线 | 对话所有者 |
| 查看 workflow 运行日志（DB） | 对话所有者（RLS） |
| Resume 活跃流 | 对话所有者 |

### 2.4 非目标（全 feature · iter-06）

- RAG 检索 node、知识库绑定  
- MCP 工具 node  
- Skills 挂载  
- LangChain / LangGraph / n8n  
- 可视化 workflow 编辑器  
- LangSmith / 第三方 APM  
- 按助理配置不同 workflow 图  
- Console 新页面  

### 2.5 非功能（摘要）

| 类型 | 要求 |
|------|------|
| 性能 | 首步 `running` 事件到达前端 < 500ms（正常网络） |
| 安全 | run / step 日志 RLS；摘要不包含 API Key |
| 部署 | 单 Vercel；chat `maxDuration` 沿用现网配置 |
| Redis | Upstash；**run 成功结束或异常后删除该 run 的 Redis 键** |
| 语言 | 用户可见 UI **English** |

### 2.6 功能索引

| ID | 功能 | 详细 PRD | 迭代 |
|----|------|----------|------|
| F-50 | Workflow 编排与 Node 流水线 | [prd/workflow-orchestration-cn.md](./prd/workflow-orchestration-cn.md) | iter-06 |
| F-51 | 步骤时间线 UI | [prd/workflow-orchestration-cn.md](./prd/workflow-orchestration-cn.md) | iter-06 |
| F-52 | 运行日志（runs + step logs） | [prd/workflow-orchestration-cn.md](./prd/workflow-orchestration-cn.md) | iter-06 |
| F-53 | 流式恢复（Upstash + resume） | [prd/stream-resume-cn.md](./prd/stream-resume-cn.md) | iter-06 |

---

## 3. 文档地图

### 3.1 产品（`prd/`）

| 文档 | 范围 |
|------|------|
| [prd/workflow-orchestration-cn.md](./prd/workflow-orchestration-cn.md) | Runner、Node、步骤事件、DB 日志、Chat UI |
| [prd/stream-resume-cn.md](./prd/stream-resume-cn.md) | Upstash、resumable stream、刷新恢复、Redis 清理 |

### 3.2 迭代变更（`changelog/`）

| 文档 | 范围 |
|------|------|
| [changelog/iter-06-cn.md](./changelog/iter-06-cn.md) | iter-06 必读 + AC 索引 |

---

## 4. 修订记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-06-24 | v0.1 | iter-06 初稿 — 用户确认 PRD |

---

*下一文档：`02-technical-design-cn.md`（由 fullstack-developer 产出）*
