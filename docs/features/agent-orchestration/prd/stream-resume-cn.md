# 流式恢复与 Upstash Redis

> **English:** [stream-resume.md](./stream-resume.md)  
> **中文：** [stream-resume-cn.md](./stream-resume-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-06  
> **关联：** [workflow-orchestration-cn.md](./workflow-orchestration-cn.md)

---

## 1. 范围

F-53 — 使用 **Upstash Redis** + Vercel AI SDK **Resumable Stream**，在浏览器刷新后恢复进行中的 token 流；run **正常结束或异常后** 清理该 run 在 Redis 中的数据。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-55 | 作为用户，在 AI 还在回复时刷新页面，回来后能继续看到已生成的文字并接着收后续 token | P0 |
| US-56 | 作为用户，仅刷新页面不应等同于「取消」本次生成（与主动 Stop 区分，若 iter-06 实现 Stop） | P1 |
| US-57 | 作为平台，每次 run 结束后不应在 Redis 中遗留该 chat/run 的缓冲数据 | P0 |

---

## 3. F-53 技术方案（产品要求）

### 3.1 存储选型

| 项 | 要求 |
|----|------|
| Redis 提供商 | **Upstash**（Serverless Redis，与 Vercel 集成） |
| 用途 | **仅** 缓冲当前活跃 SSE / resumable stream 的 chunks |
| 非用途 | 不替代 Supabase 存消息、步骤日志、对话历史 |

环境变量（名称技术设计定义，示例）：

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 3.2 Resumable Stream 行为

基于 AI SDK [Chatbot Resume Streams](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-resume-streams) 模式：

1. **POST** `/api/chat` 创建 resumable stream，生成 `activeStreamId`，关联到 `workflow_runs`
2. 流式过程中 chunks 写入 Upstash
3. **GET** resume 端点（路径技术设计定义）用 `activeStreamId` 调用 `resumeExistingStream`
4. 前端 `useChat({ resume: true })` 在 mount 时尝试恢复活跃流
5. 无活跃流时返回 **204**，前端展示 DB 中已有消息与步骤

### 3.3 刷新 vs 取消

| 用户动作 | 期望 |
|----------|------|
| 浏览器刷新 | 服务端 run **继续**（不 sole 依赖 `req.signal` abort LLM）；客户端重连 resume |
| 用户 Stop（若本迭代实现） | 中止 run，`status = cancelled`，清理 Redis |
| run 成功完成 | `status = completed`，清理 Redis |
| run 任一步 error | `status = error`，清理 Redis |

**产品要求：** mere 刷新 **不得** 作为取消 run 的唯一机制（技术设计用 run 级 AbortController 等实现）。

### 3.4 Redis 清理（用户明确要求）

**每次 chat run 结束或异常后，必须删除该 run 在 Upstash 中的全部缓冲数据。**

| 触发时机 | 清理动作 |
|----------|----------|
| run `completed` | 删除该 `activeStreamId` / run 关联的所有 Redis keys |
| run `error` | 同上 |
| run `cancelled` | 同上 |
| stream 正常 `onEnd` / `onFinish` | 清空 `workflow_runs.active_stream_id`，并删除 Redis |

**规则：**

- 清理在 run 终态确定后 **尽快** 执行（允许 `after()` 非阻塞）
- 清理失败应 **记录日志** 并支持重试或 TTL 兜底（技术设计：建议 Redis key 设 **最大 TTL**，如 30–60 分钟，防止泄漏）
- **不得** 将 API Key、完整用户消息正文写入 Redis value（仅 SSE chunk 缓冲）

### 3.5 与 Supabase 的配合

| 数据 | 存储 |
|------|------|
| 已完成步骤 | `workflow_step_logs` |
| 最终 assistant 消息 | `messages` |
| 进行中 token | Upstash（临时） |
| 活跃流指针 | `workflow_runs.active_stream_id` |

刷新后优先级：

1. 尝试 resume Redis 流（进行中 token）  
2. 同时/否则从 DB 恢复步骤时间线与已持久化消息  

### 3.6 Out of Scope（本 PRD）

- 跨 conversation 共享 Redis 键（每 run 独立）  
- Redis 存 workflow 图定义  
- 多区域 Redis 复制  

---

## 4. 验收标准

- [x] **AC-60** — 流式回复过程中刷新，续收后续 token（E2E 或手工 QA）
- [x] **AC-61** — run 完成后 Upstash 中无该 run 的残留 keys（可测：key 不存在或 TTL 内自动过期）
- [x] **AC-62** — run error 后同样清理 Redis，`workflow_runs.status = error`
- [x] **AC-63** — 无活跃流时 resume 返回 204，页面仍显示 DB 消息与已完成步骤
- [x] **AC-64** — `active_stream_id` 在 run 终态后置空

---

## 5. 依赖

- Upstash 账号与 Vercel 环境变量配置  
- [workflow-orchestration-cn.md](./workflow-orchestration-cn.md) — run / step 模型  
- `resumable-stream` npm 包（技术设计确认版本）  

---

## 6. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-24 | iter-06 初稿 — PRD 已确认；Upstash + run 结束清理 Redis |
| 2026-06-24 | AC-60–64 验收通过，与 changelog §6 同步 |
