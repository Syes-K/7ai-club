# API 说明：多会话与精简对话请求（version=0.0.2）

**关联需求**：`iterations/0.0.2/product/prd-chat-sessions-sqlite.md`  
**关联设计**：`iterations/0.0.2/design/spec-chat-sessions-sqlite.md`

---

## 1. 会话

### 1.1 `GET /api/chat/sessions`

列出会话，按 `updated_at` 降序。

**响应 200**

```json
{
  "sessions": [
    { "id": "uuid", "title": "首条用户话节选或 null", "updatedAt": 1710000000000 }
  ]
}
```

### 1.2 `POST /api/chat/sessions`

创建空会话。

**响应 201**

```json
{ "id": "uuid" }
```

---

## 2. 会话消息

### 2.1 `GET /api/chat/sessions/{sessionId}/messages`

**响应 200**

```json
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "…",
      "createdAt": 1710000000000
    }
  ]
}
```

**响应 404**：会话不存在。

### 2.2 `DELETE /api/chat/sessions/{sessionId}/messages`

清空该会话下所有消息（**不删除**会话行）。

**响应 204**：成功。  
**响应 404**：会话不存在。

---

## 3. 流式对话 `POST /api/chat`

`Content-Type: application/json`，响应为 **SSE**（`text/event-stream`），事件体为 JSON：`{ "type": "delta", "text" }` / `{ "type": "done" }` / `{ "type": "error", "message" }`。

### 3.1 兼容：`variant: legacy`（无 `sessionId`）

与 0.0.2 前行为一致：请求体含完整 `messages[]`，**不落库**。

```json
{
  "messages": [{ "role": "user", "content": "你好" }],
  "provider": "deepseek"
}
```

智谱须带 `model`。

### 3.2 目标态：`variant: session`

**不可**与 `messages` 同时出现。

**新发送一轮**

```json
{
  "sessionId": "uuid",
  "content": "本轮用户输入",
  "provider": "zhipu",
  "model": "glm-4-flash"
}
```

服务端顺序：校验会话存在 → 持久化本条 **user** → 读取该会话全部消息 → 按 `MAX_MESSAGES_IN_CONTEXT` 裁剪 → 调模型 → 流式结束后持久化 **assistant** 全文。

**重试上一轮（assistant 未成功写入时，末条为 user）**

```json
{
  "sessionId": "uuid",
  "retryLast": true,
  "provider": "deepseek"
}
```

`retryLast: true` 时**不要**带 `content`。若末条持久化消息不是 `user`，返回 **400**。

**错误**

| 状态 | 含义 |
|------|------|
| 400 | JSON/校验失败（含「不可同时使用 sessionId 与 messages」等） |
| 404 | `sessionId` 对应会话不存在 |

---

## 4. 环境变量

| 变量 | 说明 |
|------|------|
| `CHAT_SQLITE_PATH` | SQLite 文件绝对或相对路径；未设置时使用 `process.cwd()/data/chat.sqlite` |

---

## 5. 文档路径

- 迭代：`iterations/0.0.2/backend/api-spec.md`
- 同步：`docs/backend/api-spec-chat-sessions-sqlite.md`
