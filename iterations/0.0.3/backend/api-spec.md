# API 增量：删除会话（version=0.0.3）

**完整会话与聊天契约**仍以 `iterations/0.0.2/backend/api-spec.md`（及同步 `docs/backend/api-spec-chat-sessions-sqlite.md`）为准。

---

## 1. `DELETE /api/chat/sessions/{sessionId}`

删除**整个会话**及其下所有消息。数据库层依赖 `chat_messages.session_id` 的 **ON DELETE CASCADE**；实现亦可先删子表再删会话，语义一致。

**响应**

| 状态 | 说明 |
|------|------|
| **204** | 删除成功，无响应体 |
| **404** | `sessionId` 不存在 |

**说明**

- 与 `DELETE .../messages`（仅清空消息、保留会话行）**不同**；本接口删除会话行。
- 前端在删除**当前激活**会话后，须自行切换列表项或新建会话（见产品/设计 0.0.3）。

---

## 2. 文档路径

- 迭代：`iterations/0.0.3/backend/api-spec.md`
- 同步：`docs/backend/api-spec-session-delete-send-0.0.3.md`（与前端布局变更同文件索引，见该文档 §1）
