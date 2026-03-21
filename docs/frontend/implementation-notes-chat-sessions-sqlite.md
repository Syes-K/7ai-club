# 前端实现说明：多会话 UI 与精简请求（version=0.0.2）

**关联设计**：`iterations/0.0.2/design/spec-chat-sessions-sqlite.md`  
**关联 API**：`iterations/0.0.2/backend/api-spec.md`

---

## 1. 文件

| 路径 | 说明 |
|------|------|
| `src/lib/chat/session-api-client.ts` | 浏览器端会话/消息 REST 封装；`ensureAtLeastOneSession` 用队列锁避免 Strict Mode 下重复建会话 |
| `src/components/chat/SessionSidebar.tsx` | 桌面侧栏 + 窄屏抽屉（`SessionDockedSidebar` / `SessionDrawer`） |
| `src/components/chat/ChatApp.tsx` | 集成会话状态、`sessionId` + `content` / `retryLast` 的 `POST /api/chat`，加载竞态用 `loadTokenRef` |

---

## 2. 行为摘要

- **首屏**：`ensureAtLeastOneSession()` → 若有会话取列表，若无则创建一条 → 选中首条并 `GET .../messages`。
- **新对话**：`POST /api/chat/sessions` → 刷新列表 → 切换并加载空消息 → 聚焦输入框。
- **切换会话**：先清空主列表再请求，避免串线；`loadTokenRef` 丢弃过期响应。
- **发送**：仅 JSON `{ sessionId, content, provider, model? }`；UI 仍乐观追加 user + assistant 占位。
- **重试**：`{ sessionId, retryLast: true, provider, model? }`。
- **清空**：`DELETE .../messages`，本地列表清空。
- **busy**：侧栏 `pointer-events-none` + 按钮 `disabled`；与 0.0.1 一致禁用顶栏模型与输入区。
- **成功流结束后**：`refreshSessions()` 更新侧栏标题节选。

---

## 3. 偏差与假设

- **消息 id**：流式过程中 user 气泡使用客户端 UUID，与库内服务端 id 可能不一致；刷新或切换会话后以服务端为准。
- **未**再支持无会话下的 legacy 全量 `messages` 前端路径；后端仍保留 legacy 供其他客户端使用。

---

## 4. 文档路径

- 迭代：`iterations/0.0.2/frontend/implementation-notes-chat-sessions-sqlite.md`
- 同步：`docs/frontend/implementation-notes-chat-sessions-sqlite.md`
