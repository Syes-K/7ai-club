# 数据模型增量：`ChatStore.deleteSession`（version=0.0.3）

**基线**：`iterations/0.0.2/backend/data-models.md`（及同步 `docs/backend/data-models-chat-sessions-sqlite.md`）。

---

## 1. 端口 `ChatStore`

新增方法：

| 方法 | 说明 |
|------|------|
| `deleteSession(sessionId: string): boolean` | 删除会话行；消息由 FK **CASCADE** 一并删除。返回是否实际删除一行（`true` 表示此前存在）。 |

---

## 2. SQLite 行为

- `DELETE FROM chat_sessions WHERE id = ?`；`chat_messages` 由 `ON DELETE CASCADE` 自动清理。

---

## 3. 文档路径

- 迭代：`iterations/0.0.3/backend/data-models.md`
- 同步：`docs/backend/data-models-session-delete-0.0.3.md`
