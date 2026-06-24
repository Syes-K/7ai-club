# iter-06 变更摘要 — Chat API 编排重构

> **English:** [iter-06.md](./iter-06.md)  
> **中文：** [iter-06-cn.md](./iter-06-cn.md)  
> **迭代索引：** [iter-06/README-cn.md](../../iterations/iter-06/README-cn.md)

---

## 1. 主题

本迭代 **无新聊天产品功能**；`/api/chat` 与 Chat UI 由 [agent-orchestration](../../agent-orchestration/changelog/iter-06-cn.md) 驱动重构。

| 区域 | 说明 |
|------|------|
| `POST /api/chat` | WorkflowRunner 替代线性 `streamText` 调用链 |
| Chat UI | 步骤时间线（增量）；`AssistantTurn` 单气泡内嵌 workflow |
| Resume | `chat-conversation-panel` 条件 `resumeStream`（见 agent-orchestration §4.3） |
| 用户可见行为 | iter-05 模型、流式、持久化 **意图不变** — AC-54 回归已通过 |

---

## 2. 必读

1. [agent-orchestration/changelog/iter-06-cn.md](../../agent-orchestration/changelog/iter-06-cn.md)  
2. [prd/chat-model-config-cn.md](../prd/chat-model-config-cn.md) — 模型解析规则不变  

---

## 3. 实现 touchpoints（mvp-chat 视角）

| 文件 | 变更 |
|------|------|
| `app/api/chat/route.ts` | 入口改为 workflow + resumable stream |
| `components/chat/chat-conversation-panel.tsx` | `useTurnWorkflow` + 条件 resume |
| `components/chat/chat-messages.tsx` | turn 绑定步骤渲染 |
| `components/chat/assistant-turn.tsx` | 新建：assistant 气泡 + 步骤 + 正文 |
| `lib/chat/conversations.ts` | assistant 落库支持 UUID `message.id` |

交叉细节见 agent-orchestration changelog §3–§5。

---

## 4. 验收（回归）

- [x] **AC-54** — E2E iter-04/05/06 套件通过（见 agent-orchestration changelog §8）

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-24 | 创建 mvp-chat iter-06 交叉引用 |
| 2026-06-24 | §3 实现 touchpoints；resume / UI 与 agent-orchestration 校准对齐 |
| 2026-06-24 | 结项：AC-54 勾选；与 agent-orchestration 文档对齐 |
| 2026-06-24 | iter-06 **已发布** |
