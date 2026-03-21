# API 与设计索引：会话删除 + 发送布局（version=0.0.3）

## 1. 会话删除 API

### `DELETE /api/chat/sessions/{sessionId}`

删除**整个会话**及其下所有消息（外键 **ON DELETE CASCADE**）。

| 状态 | 说明 |
|------|------|
| **204** | 成功，无响应体 |
| **404** | 会话不存在 |

**区分**：`DELETE /api/chat/sessions/{sessionId}/messages` 仅清空消息、**保留**会话行；本接口删除会话行。

**基线文档**：`docs/backend/api-spec-chat-sessions-sqlite.md`（0.0.2 其余路由不变）。

---

## 2. 设计

- `docs/design/spec-session-delete-send-layout.md`

---

## 3. 文档路径

- 迭代：`iterations/0.0.3/backend/api-spec.md`
- 同步：本文档
