# Workflow 编排与步骤可见性

> **English:** [workflow-orchestration.md](./workflow-orchestration.md)  
> **中文：** [workflow-orchestration-cn.md](./workflow-orchestration-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-06  
> **关联：** [stream-resume-cn.md](./stream-resume-cn.md) · [mvp-chat/prd/chat-model-config-cn.md](../../mvp-chat/prd/chat-model-config-cn.md)

---

## 1. 范围

F-50 — WorkflowRunner 与 Node 流水线，重构 `POST /api/chat`。  
F-51 — Chat 内步骤时间线（实时更新）。  
F-52 — Supabase 运行日志（`workflow_runs`、`workflow_step_logs`）。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-50 | 作为用户，发送消息后能看到 AI 正在执行的步骤（如加载上下文、解析模型、生成回复） | P0 |
| US-51 | 作为用户，每个步骤在执行中就会更新状态，而不是等整轮结束后才显示 | P0 |
| US-52 | 作为用户，某步失败时能看到明确的错误说明，而不是空白或卡住 | P0 |
| US-53 | 作为用户，刷新页面后仍能看到本次 run 已完成的步骤记录 | P0 |
| US-54 | 作为开发者/运营，能在 DB 中查到每次 run 的每步状态与耗时，便于排查 | P1 |

---

## 3. F-50 Workflow 编排

### 3.1 背景

iter-05 的 `/api/chat` 为线性流程：`鉴权 → 加载配置 → streamText`。未来需挂载 RAG、MCP、Skills，需要可扩展、可观测的编排层。本迭代建立 **骨架**，不实现上述能力。

### 3.2 编排原则（产品层）

| 原则 | 说明 |
|------|------|
| 技术栈 | Vercel AI SDK；**不**引入 LangChain / LangGraph / n8n |
| Node 模型 | 每步为独立 Node，有 `id`、`label`（English）、`run()` |
| 顺序 | iter-06 为 **固定线性** 流水线（代码配置，非 UI 编辑） |
| 失败策略 | **任一 Node 失败 → 中断整轮**，返回用户可读错误；不静默跳过 |
| 扩展 | 为 `rag_retrieve`、`mcp_tools`、`skills` 等预留 Node 插槽（本迭代不实现） |
| LLM | 继续使用 iter-05 用户模型解析与 `streamText` |

### 3.3 iter-06 Node 清单（初版）

| Node ID | Label（English · 用户可见） | 职责 |
|---------|---------------------------|------|
| `validate_request` | Validating request | 鉴权、参数、非空消息 |
| `load_context` | Loading conversation | conversation、history、assistant |
| `resolve_model` | Resolving model | Profile 用户模型 / 平台默认 |
| `llm_stream` | Generating response | LLM 流式生成并持久化 assistant 消息 |

技术设计可合并或拆分 Node，但 **用户可见步骤数 ≥ 4**，语义与上表一致。

### 3.4 步骤事件（StepEvent）

每个 Node 向客户端推送结构化事件（经 AI SDK custom data part，如 `data-workflow-step`）：

| 字段 | 说明 |
|------|------|
| `runId` | 本次 workflow run 唯一 ID |
| `nodeId` | Node 标识 |
| `label` | English 展示名 |
| `status` | `running` \| `success` \| `error` |
| `summary` | 可选；success 时简短摘要（如 model label） |
| `error` | 可选；error 时用户友好 English 文案 |
| `startedAt` / `finishedAt` | ISO 时间（可选展示） |

**规则：**

- Node **进入时** 立即 emit `running`
- Node **完成时** emit `success` + `summary`（若有）
- Node **抛错时** emit `error` + `error` 文案，并终止后续 Node
- LLM token 流与步骤事件 **并行** 推送，不互相阻塞

### 3.5 与 iter-05 行为等价性

| 能力 | iter-06 要求 |
|------|-------------|
| 用户模型 / 平台默认 | 与 iter-05 一致 |
| assistant `system_prompt` | 不变 |
| 流式 Markdown 回复 | 不变 |
| Untested/Failed 模型拒绝 | 不变（可在 `resolve_model` 步骤体现 error） |
| 消息持久化 | user 消息仍先落库；assistant 在流结束后落库 |

---

## 4. F-51 步骤时间线 UI

### 4.1 位置

- **页面：** `/chat/[conversationId]`，当前 assistant 回复区域内或紧邻流式消息上方
- **可见性：** **所有登录用户**可见（非 debug-only）

### 4.2 交互

| 状态 | UI（English 示例） |
|------|-------------------|
| `running` | 步骤名 + loading 指示（如 “Resolving model…”) |
| `success` | 步骤名 + 勾选 + 可选摘要（如 “qwen3.6-plus (bailian)”） |
| `error` | 步骤名 + 错误样式 + `error` 文案 |

**规则：**

- 步骤按执行顺序纵向排列（时间线 / 折叠面板均可，技术设计 + UI 实现）
- 默认 **展开** 当前 run 的步骤区；历史消息可不重复展示旧 run 步骤（或折叠，技术设计可选）
- 仅 **English** 文案
- 遵循 [loading-ux-cn.md](../../../loading-ux-cn.md) 异步反馈原则

### 4.3 刷新后（与 F-52 / stream-resume 配合）

- 从 Supabase 恢复 **已完成** 的 step logs，重绘时间线
- 若 run 仍进行中，结合 [stream-resume-cn.md](./stream-resume-cn.md) 续收 token 与后续步骤

---

## 5. F-52 运行日志（Supabase）

### 5.1 表（概念名，技术设计可微调）

**`workflow_runs`**

| 字段（概念） | 说明 |
|-------------|------|
| `id` | run UUID |
| `conversation_id` | 关联对话 |
| `user_id` | 所有者 |
| `status` | `running` \| `completed` \| `error` \| `cancelled` |
| `active_stream_id` | 活跃 resumable stream ID（若有） |
| `started_at` / `finished_at` | 时间戳 |
| `error_message` | run 级错误摘要（可选） |

**`workflow_step_logs`**

| 字段（概念） | 说明 |
|-------------|------|
| `id` | step log UUID |
| `run_id` | 外键 |
| `node_id` | Node 标识 |
| `label` | English |
| `status` | `running` \| `success` \| `error` |
| `summary` | 文本摘要（无密钥） |
| `error_message` | 错误文案 |
| `started_at` / `finished_at` | 耗时排查 |
| `duration_ms` | 可选 |

### 5.2 写入时机

- run 创建：用户消息已保存、workflow 开始前
- 每步：与 SSE emit **同步或紧接** 写入（至少 success/error 必须落库）
- run 结束：更新 `status`；成功或失败后触发 Redis 清理（见 stream-resume PRD）

### 5.3 权限

- RLS：`user_id = auth.uid()` 或经由 `conversation_id` 所有权
- 客户端 **不** 直接读日志表（MVP：仅服务端写；UI 靠 SSE + 刷新后服务端聚合可选）

---

## 6. 验收标准

- [x] **AC-50** — 发消息后 Chat 显示 ≥4 步时间线，文案 English
- [x] **AC-51** — 某步 `running` 在 Node 开始后 500ms 内出现在 UI（正常网络）
- [x] **AC-52** — 某步失败时显示 `error` 文案，后续 Node 不执行
- [x] **AC-53** — `workflow_runs` 与 `workflow_step_logs` 有对应记录，RLS 隔离
- [x] **AC-54** — iter-05 模型选择、流式回复、assistant 持久化行为回归通过
- [x] **AC-55** — 刷新后已完成步骤可从持久化数据恢复显示

---

## 7. 依赖

- iter-05 — 用户模型配置、`/api/chat` 基线  
- [mvp-chat/prd/core-chat-cn.md](../../mvp-chat/prd/core-chat-cn.md) — 聊天壳与 `useChat`  
- [stream-resume-cn.md](./stream-resume-cn.md) — 刷新续流与 Redis 清理  

---

## 8. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-24 | iter-06 初稿 — PRD 已确认 |
| 2026-06-24 | AC-50–55 验收通过，与 changelog §6 同步 |
