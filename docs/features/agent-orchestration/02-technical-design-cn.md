# Agent 编排 — 技术设计总纲

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文：** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **项目：** 7ai-club  
> **Feature slug：** `agent-orchestration`  
> **路线图阶段：** 2 — Agent 编排基础  
> **关联 PRD：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)  
> **状态：** iter-06 **已发布** · iter-07 **已发布**（2026-06-26）  
> **技术设计日期：** iter-06 · 2026-06-24 · iter-07 · 2026-06-25  
> **文档版本：** v0.4

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

---

## 2. 全局架构

| 项 | iter-06 | iter-07 增量 |
|----|---------|-------------|
| 编排 | `lib/workflow/` Runner + 线性 Node | +3 nodes；post-LLM evaluate/summarize |
| 流式协议 | `createUIMessageStream` | 不变 |
| 步骤事件 | `data-workflow-step` | Generate 先、Evaluating/Summarizing 后 |
| 持久化 | workflow 表 | + memory summary 表 + `summarized_at` |
| LLM | `resolve_model` + `streamText` | chat 前 summary+active；chat 后 `generateText` 摘要 |
| 运行时 | `nodejs` · maxDuration 130s | 不变 |

---

## 3. 设计文档地图

| 文档 | 范围 | 状态 |
|------|------|------|
| [design/workflow-orchestration-cn.md](./design/workflow-orchestration-cn.md) | Runner、Node、DB、POST、UI | iter-06 已发布 |
| [design/stream-resume-cn.md](./design/stream-resume-cn.md) | Upstash、resume、Redis 清理 | iter-06 已发布 |
| [design/history-summarization-cn.md](./design/history-summarization-cn.md) | 摘要 DB、lib/memory、Nodes、Preferences、Clear chat | **iter-07 已发布** |

---

## 4. API 一览

| 方法 | 路径 | iter-07 变更 |
|------|------|-------------|
| POST | `/api/chat` | pre-LLM nodes + post-LLM memory **after** `runLlmStreamNode` |
| GET | `/api/chat/[conversationId]/stream` | 无变更 |
| GET | `/api/chat/[conversationId]/workflow` | 返回 `{ runs: [...] }`；按 user turn 匹配最佳 run |
| — | Profile save | 扩展 memory 字段 |

Clear chat：现有 `clearConversationMessages` 扩展删 summary。

---

## 5. 环境变量

iter-07 **无新增** env。沿用 iter-05 LLM keys、iter-06 Upstash。

---

## 6. 文件变更索引（iter-07 摘要）

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

## 7. 实现顺序（iter-07）

1. Migration + `lib/memory/persistence`  
2. evaluate / turns 单元测试  
3. Pre-LLM workflow nodes + post-LLM memory **after** `llm_stream`  
4. Preferences UI  
5. Clear chat + step expand UI  
6. Workflow 多 turn 恢复 + run 匹配 + RLS 补丁 migration  
7. E2E + 回归（**已通过** · 2026-06-26）

---

## 8. 编码期偏差与补丁

详见 [changelog/iter-07-cn.md](./changelog/iter-07-cn.md) §7–§10。要点：

- 软归档需 `messages` UPDATE RLS  
- `workflow_runs.user_message_id` 须写 DB UUID，非客户端 message id  
- 多 run / 少 user message 时禁止顺序推断，改时间窗口匹配  

---

## 9. 修订记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-06-24 | v0.1 | iter-06 技术设计 |
| 2026-06-25 | v0.2 | iter-07 历史摘要技术设计草稿 |
| 2026-06-25 | v0.3 | **方案 B** — evaluate/summarize 后置 llm_stream |
| 2026-06-25 | v0.4 | 技术设计已确认；编码完成；API/文件索引与 changelog 同步 |
| 2026-06-26 | v0.5 | 测试验收通过；iter-07 **已发布** |
