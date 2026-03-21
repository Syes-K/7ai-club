# 服务端实现说明：删除会话（version=0.0.3）

**关联需求**：`iterations/0.0.3/product/prd-session-delete-send-layout.md`  
**关联设计**：`iterations/0.0.3/design/spec-session-delete-send-layout.md`

---

## 1. 代码变更

| 文件 | 变更 |
|------|------|
| `src/lib/chat/store/port.ts` | `ChatStore` 增加 `deleteSession` |
| `src/lib/chat/store/sqlite-store.ts` | `DELETE FROM chat_sessions WHERE id = ?` |
| `src/app/api/chat/sessions/[sessionId]/route.ts` | **新增** `DELETE`，404 / 204 |

**说明**：与 `[sessionId]/messages/route.ts` 并列；`DELETE` 会话与 `DELETE` 消息路径不冲突。

---

## 2. 自测

1. `POST /api/chat/sessions` → `DELETE /api/chat/sessions/{id}` → `GET /api/chat/sessions` 无该 id。  
2. 对已删 id 再 `DELETE` → 404。  
3. 删前写入若干消息，删后 `GET .../messages` 应 404（会话不存在）。

---

## 3. 前端

见 `docs/frontend/implementation-notes-session-delete-send.md`。

---

## 4. 文档路径

- 迭代：`iterations/0.0.3/backend/implementation-notes-session-delete-send.md`
- 同步：`docs/backend/implementation-notes-session-delete-send.md`
