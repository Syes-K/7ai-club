# Agent 编排 — 技术设计总纲

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文：** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **项目：** 7ai-club  
> **Feature slug：** `agent-orchestration`  
> **路线图阶段：** 2 — Agent 编排基础  
> **关联 PRD：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)  
> **状态：** iter-06 **草稿 — 待用户确认**  
> **技术设计日期：** 2026-06-24  
> **文档版本：** v0.1

---

## 1. 概述

iter-06 在现有 `POST /api/chat` 上引入 **WorkflowRunner**（Vercel AI SDK `createUIMessageStream`），将鉴权、加载上下文、解析模型、LLM 流式拆为 4 个 Node，经 `data-workflow-step` 实时推送步骤状态，并写入 Supabase `workflow_runs` / `workflow_step_logs`。流式回复通过 **Upstash Redis** + `resumable-stream` 支持刷新 resume；run 终态后清理 Redis。不引入 LangChain / LangGraph。

**实现前必读：**

1. [changelog/iter-06-cn.md](./changelog/iter-06-cn.md)  
2. [design/workflow-orchestration-cn.md](./design/workflow-orchestration-cn.md)  
3. [design/stream-resume-cn.md](./design/stream-resume-cn.md)

---

## 2. 全局架构（iter-06）

| 项 | 选择 |
|----|------|
| 编排 | `lib/workflow/` — Runner + 线性 Node 注册表 |
| 流式协议 | `createUIMessageStream` → `createUIMessageStreamResponse` + `consumeSseStream` |
| 步骤事件 | custom part `data-workflow-step` |
| 持久化 | Supabase `workflow_runs`、`workflow_step_logs`（RLS） |
| 流缓冲 | Upstash Redis（`resumable-stream`） |
| LLM | 沿用 `resolveUserModelForChat` + `streamText` |
| 运行时 | `nodejs`；`maxDuration` 130s（不变） |
| 前端 | `useChat({ resume: true })` + `WorkflowStepTimeline` |

---

## 3. 设计文档地图

| 文档 | 范围 | 状态 |
|------|------|------|
| [design/workflow-orchestration-cn.md](./design/workflow-orchestration-cn.md) | Runner、Node、DB、API POST、UI | iter-06 草稿 |
| [design/stream-resume-cn.md](./design/stream-resume-cn.md) | Upstash、GET resume、abort、Redis 清理 | iter-06 草稿 |

---

## 4. API 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | 发消息、启动 workflow、resumable SSE |
| GET | `/api/chat/[conversationId]/stream` | resume 活跃流；无流 204 |
| GET | `/api/chat/[conversationId]/workflow` | 刷新后拉取进行中 run + step logs（可选 BFF） |

---

## 5. 依赖包（新增）

| 包 | 用途 |
|----|------|
| `resumable-stream` | AI SDK resumable SSE（Upstash 后端） |
| `@upstash/redis` | Redis REST 客户端（若 `resumable-stream` 需显式配置） |

具体版本在编码阶段 `pnpm add` 时锁定；设计假定与 `ai@6` 文档示例兼容。

---

## 6. 环境变量（新增）

| 变量 | 说明 |
|------|------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

本地 / Vercel Production / Preview 均需配置；缺失时 POST 仍可用但 **无 resume**（开发日志 warning，生产视为配置错误）。

---

## 7. 文件变更索引

详见各 `design/*.md` §文件变更。摘要：

| 操作 | 路径 |
|------|------|
| 新增 | `supabase/migrations/20260624000000_iter06_workflow.sql` |
| 新增 | `lib/workflow/**` |
| 新增 | `lib/redis/**` |
| 修改 | `app/api/chat/route.ts` |
| 新增 | `app/api/chat/[conversationId]/stream/route.ts` |
| 新增 | `app/api/chat/[conversationId]/workflow/route.ts` |
| 新增 | `components/chat/workflow-step-timeline.tsx` |
| 修改 | `components/chat/chat-conversation-panel.tsx` |
| 修改 | `components/chat/chat-messages.tsx` |
| 修改 | `.env.example` |

---

## 8. 实现顺序建议

1. Migration + `lib/workflow/persistence`  
2. Runner + nodes（无 Redis，单元测试）  
3. POST `/api/chat` 重构 + step SSE  
4. `WorkflowStepTimeline` + `onData`  
5. Upstash + resumable stream + GET stream  
6. GET workflow 状态（刷新恢复步骤）  
7. E2E 回归 + 手工 QA（含刷新 resume）

---

## 9. 修订记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-06-24 | v0.1 | iter-06 技术设计草稿 |

---

*确认后回复：`技术设计已确认，可开始编码`*
