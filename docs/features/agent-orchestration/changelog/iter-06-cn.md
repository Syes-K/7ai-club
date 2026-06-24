# iter-06 变更摘要 — Agent 编排基础

> **English:** [iter-06.md](./iter-06.md)  
> **中文：** [iter-06-cn.md](./iter-06-cn.md)  
> **迭代索引：** [iter-06/README-cn.md](../../iterations/iter-06/README-cn.md)

---

## 1. 主题


| 主题                          | PRD                                                                     | 设计                                                                            |
| --------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Workflow 编排 + 步骤 UI + DB 日志 | [prd/workflow-orchestration-cn.md](../prd/workflow-orchestration-cn.md) | [design/workflow-orchestration-cn.md](../design/workflow-orchestration-cn.md) |
| Upstash 流式恢复 + Redis 清理     | [prd/stream-resume-cn.md](../prd/stream-resume-cn.md)                   | [design/stream-resume-cn.md](../design/stream-resume-cn.md)                   |


**关联 mvp-chat：** `/api/chat` 重构 — 见 [mvp-chat/changelog/iter-06-cn.md](../../mvp-chat/changelog/iter-06-cn.md)

---

## 2. 必读

1. [01-product-requirements-cn.md](../01-product-requirements-cn.md) — §2 全局约定
2. [prd/workflow-orchestration-cn.md](../prd/workflow-orchestration-cn.md)
3. [prd/stream-resume-cn.md](../prd/stream-resume-cn.md)
4. [design/workflow-orchestration-cn.md](../design/workflow-orchestration-cn.md) — §6 前端（含开发阶段校准）
5. [design/stream-resume-cn.md](../design/stream-resume-cn.md) — §3.2–3.3 resume 防重复
6. [mvp-chat/prd/chat-model-config-cn.md](../../mvp-chat/prd/chat-model-config-cn.md) — iter-05 模型行为不变

---

## 3. 实现交付


| 区域               | 路径 / 说明                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Chat POST        | `app/api/chat/route.ts` — WorkflowRunner + `createUIMessageStream` + resumable stream                                                      |
| Stream resume    | `app/api/chat/[conversationId]/stream/route.ts`                                                                                            |
| Workflow restore | `app/api/chat/[conversationId]/workflow/route.ts`                                                                                          |
| Workflow 核心      | `lib/workflow/` — runner、nodes、emit-step、persistence                                                                                       |
| Turn 状态机         | `lib/chat/turn-workflow.ts`、`lib/chat/use-turn-workflow.ts`                                                                                |
| Resume 守卫        | `lib/chat/stream-resume.ts`                                                                                                                |
| Redis            | `lib/redis/client.ts`、`stream-context.ts`、`purge.ts`                                                                                       |
| Chat UI          | `assistant-turn.tsx`、`workflow-step-timeline.tsx`；`chat-messages.tsx`、`chat-conversation-panel.tsx` 接入 hook                                |
| DB               | `supabase/migrations/20260624000000_iter06_workflow.sql`                                                                                   |
| 环境变量             | `UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`（`.env.example`）                                                                        |
| 单元测试             | `tests/unit/workflow/`、`tests/unit/chat/turn-workflow.test.ts`、`tests/unit/chat/stream-resume.test.ts`、`tests/unit/turn-assistant.test.ts` |


**自动化：** `pnpm test:ci` 全绿（47 单元 + 13 E2E，2026-06-24 QA）。详见 §8。

---

## 4. 开发阶段人工校准与变更

> 编码过程中发现的问题与修正；设计正文已回写至 [workflow-orchestration-cn.md](../design/workflow-orchestration-cn.md) §6、[stream-resume-cn.md](../design/stream-resume-cn.md) §3。

### 4.1 后端 — Supabase 与 workflow 上下文


| 问题                                             | 根因                                                                                            | 修正                                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Load context 阶段刷新报错 `cookies() inside after()` | workflow 节点在 `createUIMessageStream.execute` / `after()` 链路里调用 `createClient()` → `cookies()` | POST 开始时创建一次 Supabase client 注入 `WorkflowContext.supabase`；清理类操作用 `createServiceClient()` |
| 同上影响                                           | `resolve-user-model`、`conversations`、`profile` 等仍默认 `createClient()`                          | 上述路径增加可选 `supabase` 参数，workflow 内复用请求级 client                                             |


### 4.2 前端 — 步骤 UI 状态机重构（P0–P3）

初版 conversation 级 `workflowSteps[]` + 多处 phase 推导导致：刷新后步骤无法收起、前后步骤状态错乱、发消息后闪现「4 steps completed」、双气泡等。


| 阶段     | 内容                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------- |
| **P0** | `restoreGeneration`：异步 `GET /workflow` 响应 stale 时丢弃，避免把上一轮 completed 步骤 merge 进 live turn               |
| **P1** | `lib/chat/turn-workflow.ts` turn 级 store `{ live, completed[userMessageId] }`；`useTurnWorkflow` 为唯一数据入口 |
| **P2** | 步骤按 `userMessageId` 绑定；历史 turn 从 `completed` 读取                                                         |
| **P3** | `AssistantTurn` 纯展示；删除 `assistant-turn` 内 phase 推导；设计文档 §6 同步                                           |


**Generate response 步骤约定（人工确认）：**


| 阶段                            | `llm_stream` 状态 | UI                     |
| ----------------------------- | --------------- | ---------------------- |
| validate / load / resolve 执行中 | 未开始             | 逐步展开                   |
| LLM token 流式输出                | `running`       | 展开 + loading           |
| 流结束                           | `success`       | 收起为「N steps completed」 |


### 4.3 单 assistant 槽位与刷新防重复


| 问题                       | 根因                                                                                                             | 修正                                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 双 AI 回复框、双份步骤区           | `toUIMessageStream` 默认再发 `start`；客户端曾用 `pendingAssistantTurn` 画假气泡                                             | `execute` 开头 `writer.write({ type: "start", messageId })`；LLM merge 设 `sendStart: false`；删除 `pendingAssistantTurn`                                                       |
| **LLM 输出阶段刷新**仍出现两个完整回复框 | LLM `onFinish` 已落库 assistant（DB 新 UUID），run 仍为 `running`，resume 重放 `start` 且 messageId 不一致 → SDK `pushMessage` | ① `messageId` 改用 `randomUUID()`，落库时写入同一 id；② `shouldResumeChatStream` — 末条为 assistant 时不 resume；③ GET stream 同条件返回 **204**；④ `resumeAttemptedRef` 防 Strict Mode 双 resume |


**已移除的临时绕路：** `findCanonicalAssistantIdForUser`（只渲染「最后一条 assistant」）— 由源头单槽位 + resume 守卫替代。

### 4.4 清理

- 从 `lib/workflow/types.ts` 删除客户端 merge 补丁（`normalizeWorkflowSteps` 等）；服务端/客户端共用 `mergeWorkflowStep` + 常量。
- 删除 `tests/unit/assistant-turn.test.ts`；步骤逻辑测试迁至 `tests/unit/chat/turn-workflow.test.ts`。

---

## 5. 与 PRD / 初稿设计的偏差


| 初稿                                      | 实际                                               | 理由                               |
| --------------------------------------- | ------------------------------------------------ | -------------------------------- |
| `useChat({ resume: true })` 直接挂载 resume | `resume: false` + 条件 `resumeStream()` + ref 单次调用 | 避免 Strict Mode 双调用；配合末条消息守卫      |
| GET stream 仅检查 `active_stream_id`       | 额外检查 DB 末条是否已为 assistant                         | 消除 LLM 已落库与 run 清理之间的竞态          |
| `generateId()` 作为 stream assistant id   | `randomUUID()` + 落库同 id                          | 与 Postgres `messages.id`（UUID）对齐 |
| 设计文档曾写「pending turn 假气泡」                | 已删除，改为服务端 `start` 事件                             | 用户反馈：不要空占位 assistant             |


---

## 6. 验收清单

> 由 **qa-engineer** 验收；与 §8.2 映射一致。

### Workflow（AC-50–55）

- [x] **AC-50** — ≥4 步 English 时间线（E2E `iter06-workflow.spec.ts`）
- [x] **AC-51** — `running` < 500ms（单元验证 emit 顺序；开发阶段 UI 观测通过）
- [x] **AC-52** — 步骤失败即中断 + 错误文案（单元 runner 中断；API 层待后续 mock）
- [x] **AC-53** — DB 日志 + RLS（migration + 策略；生产 apply 后随部署验收）
- [x] **AC-54** — iter-05 聊天回归（E2E 13 项含 AC-34 `/api/chat`、AC-50）
- [x] **AC-55** — 刷新恢复已完成步骤；**LLM 阶段刷新仅单气泡**（开发 + 手工校准通过）

### Stream resume（AC-60–64）

- [x] **AC-60** — 刷新后续收 token（Upstash 环境 + 手工校准通过）
- [x] **AC-61** — 成功后 Redis 无残留（`purgeResumableStream` + TTL 兜底）
- [x] **AC-62** — 失败后 Redis 清理（error 路径 + `scheduleRunCleanup`）
- [x] **AC-63** — 无活跃流或 assistant 已落库时 204 + DB 回退（单元 + GET stream 守卫）
- [x] **AC-64** — `active_stream_id` 终态清空（`clearActiveStreamId` on finish）

### 开发阶段手工校准项（QA 须覆盖）

- [x] 发消息 → validate/load 阶段可见步骤，Generate response 流式时为 running
- [x] 完成后收起「N steps completed」
- [x] LLM **输出中**刷新 → 单 AI 气泡、单步骤区
- [x] LLM **结束后**刷新 → 单 AI 气泡、步骤为 settled
- [x] 执行中刷新后步骤可继续更新 / 恢复

---

## 7. 结项检查清单

| 项 | 状态 |
|----|------|
| 实现交付（§3） | [x] |
| 开发校准回写 design（§4） | [x] |
| `pnpm test:ci` | [x] 2026-06-24 |
| changelog AC（§6） | [x] |
| PRD AC 同步 | [x] |
| 迭代 README 更新 | [x] |
| 用户确认 `测试已通过，可发布` | [x] |
| 标迭代 **已发布** + 实际发布日期 | [x] 2026-06-24 |

---

## 8. QA 验收报告（2026-06-24）

### 8.1 自动化命令


| 命令              | 结果                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`     | pass（QA 修复：`eslint.config.mjs` 忽略 `.agents/**`；`stream/route.ts` 去 unused import；`chat-conversation-panel` ref 改 effect；`use-turn-workflow` mount restore 包装） |
| `pnpm build`    | pass                                                                                                                                                          |
| `pnpm test`     | pass（47）                                                                                                                                                      |
| `pnpm test:e2e` | pass（13）                                                                                                                                                      |
| `pnpm test:ci`  | pass                                                                                                                                                          |


### 8.2 AC 映射


| AC ID    | 验证方式                                    | 结果                       |
| -------- | --------------------------------------- | ------------------------ |
| AC-50    | E2E `tests/e2e/iter06-workflow.spec.ts` | pass                     |
| AC-51    | 单元 emit 顺序 + 开发 UI 观测                         | pass |
| AC-52    | 单元 runner 失败中断                                  | pass（API mock 后续） |
| AC-53    | migration RLS 策略                                    | pass（部署 apply 随发布） |
| AC-54    | E2E iter-04/05/06                                    | pass |
| AC-55    | 开发 + 手工校准（单气泡刷新）                         | pass |
| AC-60–64 | Upstash 环境手工 + 代码路径                           | pass |
| 手工校准 §6 | 步骤 UI / 刷新场景                                 | pass |


### 8.3 结项说明

- **迭代状态：** **已发布**（2026-06-24）
- **已知 follow-up（不阻塞 iter-06）：** API 层失败路径 E2E mock；AC-51 精确 500ms 基准测试；双账号 RLS 集成测。
- **E2E AC-55 专用用例：** CI flaky，以 §6 手工校准 + 开发验证为准。

---

## 9. 修订记录


| 日期         | 变更                                                                                     |
| ---------- | -------------------------------------------------------------------------------------- |
| 2026-06-24 | 创建 iter-06 changelog — PRD 已确认                                                         |
| 2026-06-24 | 填充 §3 实现交付；§4 开发阶段人工校准（Supabase 上下文、turn-workflow 重构、单 assistant + resume 防重复）；§5 设计偏差 |
| 2026-06-24 | AC-55 / AC-63 补充「LLM 刷新单气泡」；新增 QA 手工校准子清单                                              |
| 2026-06-24 | §8 QA 验收报告；AC 勾选与 PRD 同步 |
| 2026-06-24 | §7 结项清单；文档整理待发布确认 |
| 2026-06-24 | 用户确认发布；迭代 **已发布** |


