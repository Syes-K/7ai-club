# Agent 编排 — 技术设计总纲

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文：** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **项目：** 7ai-club  
> **Feature slug：** `agent-orchestration`  
> **路线图阶段：** 2 — Agent 编排基础  
> **关联 PRD：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)  
> **状态：** iter-06 **已发布** · iter-07 **已发布** · **iter-08 进行中**  
> **技术设计日期：** iter-06 · 2026-06-24 · iter-07 · 2026-06-25 · iter-08 · 2026-06-26  
> **文档版本：** v0.6

---

## 1. 概述

### iter-06（已发布）

在现有 `POST /api/chat` 上引入 **WorkflowRunner**（Vercel AI SDK `createUIMessageStream`），4 Node 流水线 + Upstash resumable stream + Supabase workflow 日志。详见 [changelog/iter-06-cn.md](./changelog/iter-06-cn.md)。

### iter-07（已发布）

在 iter-06 流水线中插入历史对话摘要；**方案 B**：`load_history_summary` 在 LLM 前，`evaluate_summarization` + `summarize_history` 在 assistant 落库后。

**iter-07 实现前必读：**

1. [changelog/iter-07-cn.md](./changelog/iter-07-cn.md)  
2. [prd/history-summarization-cn.md](./prd/history-summarization-cn.md)  
3. [design/history-summarization-cn.md](./design/history-summarization-cn.md)

### iter-08（进行中）

Workflow 步骤 UI 重构：默认折叠 Panel、Registry 组件、StepEvent 协议扩展、Reasoning stream。

**iter-08 实现前必读：**

1. [changelog/iter-08-cn.md](./changelog/iter-08-cn.md)  
2. [prd/workflow-step-ui-cn.md](./prd/workflow-step-ui-cn.md)  
3. [design/workflow-step-ui-cn.md](./design/workflow-step-ui-cn.md)

---

## 2. 全局架构

| 项 | iter-06 | iter-07 增量 | iter-08 增量 |
|----|---------|-------------|-------------|
| 编排 | `lib/workflow/` Runner + 线性 Node | +3 nodes；post-LLM evaluate/summarize | catalog metadata；reasoning 条件 emit |
| 流式协议 | `createUIMessageStream` | 不变 | + `data-workflow-step-delta` |
| 步骤事件 | `data-workflow-step` | Generate 先、Evaluating/Summarizing 后 | + detail/kind/order/skipped |
| 持久化 | workflow 表 | + memory summary 表 + `summarized_at` | step_logs 扩展列 |
| LLM | `resolve_model` + `streamText` | chat 前 summary+active；chat 后 `generateText` 摘要 | reasoning bridge + capabilities |
| UI | 步骤时间线 | inline 展开摘要 | 默认折叠 Panel + Registry |
| 运行时 | `nodejs` · maxDuration 130s | 不变 | 不变 |

---

## 3. 设计文档地图

| 文档 | 范围 | 状态 |
|------|------|------|
| [design/workflow-orchestration-cn.md](./design/workflow-orchestration-cn.md) | Runner、Node、DB、POST、UI | iter-06 已发布 |
| [design/stream-resume-cn.md](./design/stream-resume-cn.md) | Upstash、resume、Redis 清理 | iter-06 已发布 |
| [design/history-summarization-cn.md](./design/history-summarization-cn.md) | 摘要 DB、lib/memory、Nodes、Preferences、Clear chat | iter-07 已发布 |
| [design/workflow-step-ui-cn.md](./design/workflow-step-ui-cn.md) | 步骤 Panel、Registry、Reasoning、协议、migration | **iter-08 草稿** |

---

## 4. API 一览

| 方法 | 路径 | iter-07 变更 |
|------|------|-------------|
| POST | `/api/chat` | pre-LLM nodes + post-LLM memory **after** `runLlmStreamNode` |
| GET | `/api/chat/[conversationId]/stream` | 无变更 |
| GET | `/api/chat/[conversationId]/workflow` | iter-08：steps 含 detail/kind/order/skipped |
| — | Profile save | 扩展 memory 字段 |

Clear chat：现有 `clearConversationMessages` 扩展删 summary。

---

## 5. 环境变量

iter-07 **无新增** env。沿用 iter-05 LLM keys、iter-06 Upstash。

---

## 6. 文件变更索引（iter-08 摘要）

详见 [design/workflow-step-ui-cn.md](./design/workflow-step-ui-cn.md) §7。

| 操作 | 路径 |
|------|------|
| 新增 | `supabase/migrations/20260626000000_iter08_workflow_step_ui.sql` |
| 新增 | `lib/workflow/node-catalog.ts` · `step-payload.ts` · `sort-steps.ts` |
| 新增 | `lib/llm/model-capabilities.ts` |
| 新增 | `components/chat/workflow/**` |
| 修改 | `lib/workflow/types.ts` · `persistence.ts` · `nodes/llm-stream.ts` · `nodes/post-llm-memory.ts` |
| 修改 | `lib/chat/turn-workflow.ts` · `use-turn-workflow.ts` · `assistant-turn.tsx` |
| 删除/迁移 | `components/chat/workflow-step-timeline.tsx` |

---

## 7. 文件变更索引（iter-07 · 已发布）

详见 [design/history-summarization-cn.md](./design/history-summarization-cn.md) §9。

| 操作 | 路径 |
|------|------|
| 新增 | `supabase/migrations/20260625000000_iter07_conversation_memory.sql` |
| 新增 | `supabase/migrations/20260625230000_iter07_messages_update_workflow_user_message.sql` |
| 新增 | `lib/memory/**`、3 workflow node 文件、`lib/workflow/match-runs-to-messages.ts` |
| 修改 | `app/api/chat/route.ts` — post-LLM after `llm_stream` |
| 修改 | `lib/workflow/persistence.ts` — run ↔ user message 匹配 |
| 修改 | `lib/chat/turn-workflow.ts` · `use-turn-workflow.ts` — 多 turn 恢复 |
| 修改 | Preferences + Clear chat + `workflow-step-timeline.tsx` |

---

## 8. 实现顺序（iter-08）

1. Migration + types + persistence  
2. node-catalog + step-payload + skipped emit  
3. Frontend `components/chat/workflow/` Panel + Registry  
4. turn-workflow delta + sort + header utils  
5. model-capabilities + llm-stream reasoning bridge  
6. E2E 更新 + 全量回归  

---

## 9. 实现顺序（iter-07 · 已发布）

1. Migration + `lib/memory/persistence`  
2. evaluate / turns 单元测试  
3. Pre-LLM workflow nodes + post-LLM memory **after** `llm_stream`  
4. Preferences UI  
5. Clear chat + step expand UI  
6. Workflow 多 turn 恢复 + run 匹配 + RLS 补丁 migration  
7. E2E + 回归（**已通过** · 2026-06-26）

---

## 10. 编码期偏差与补丁

详见 [changelog/iter-07-cn.md](./changelog/iter-07-cn.md) §7–§10。要点：

- 软归档需 `messages` UPDATE RLS  
- `workflow_runs.user_message_id` 须写 DB UUID，非客户端 message id  
- 多 run / 少 user message 时禁止顺序推断，改时间窗口匹配  

---

## 11. 修订记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-06-24 | v0.1 | iter-06 技术设计 |
| 2026-06-25 | v0.2 | iter-07 历史摘要技术设计草稿 |
| 2026-06-25 | v0.3 | **方案 B** — evaluate/summarize 后置 llm_stream |
| 2026-06-25 | v0.4 | 技术设计已确认；编码完成；API/文件索引与 changelog 同步 |
| 2026-06-26 | v0.5 | 测试验收通过；iter-07 **已发布** |
| 2026-06-26 | v0.6 | iter-08 Workflow 步骤 UI 技术设计草稿 |
