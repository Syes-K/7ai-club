# API 规格：助手（version=0.3.1）

**基线**：与现有 `/api/console/*`、`/api/chat/*` 一致，JSON，`runtime: nodejs`，鉴权假设与控制台相同（部署侧限制暴露面）。

---

## 1. 管理端 — 助手 CRUD

**前缀**：`/api/console/assistants`

### 1.1 `GET /api/console/assistants`

列出全部助手（按 `updated_at` 降序）。

**响应 200**

```json
{
  "assistants": [
    {
      "id": "uuid",
      "name": "string",
      "iconEmoji": "🤖",
      "knowledgeBaseIds": ["kb-id-1"],
      "quickPhraseCount": 3,
      "updatedAt": 1710000000000
    }
  ]
}
```

- `prompt` **不在列表中**返回（体积大）；详情/编辑用 `GET` 单条。

### 1.2 `GET /api/console/assistants/[assistantId]`

**响应 200**：完整字段，含 `prompt`、`knowledgeBaseIds`、`quickPhrases: string[]`。

**404**：不存在。

### 1.3 `POST /api/console/assistants`

**请求体**

```json
{
  "name": "string",
  "prompt": "string",
  "iconEmoji": "🤖",
  "knowledgeBaseIds": [],
  "quickPhrases": []
}
```

- `knowledgeBaseIds`、`quickPhrases` **可省略**或 **`[]`**，表示不关联知识库、不配置快捷语。

**响应 201**：`{ "assistant": { ...完整对象 } }`

**400**：校验失败，`{ "error": "string" }`

### 1.4 `PUT /api/console/assistants/[assistantId]`

同 POST 字段（全量替换），**200** `{ "assistant": { ... } }`，**404** / **400**。

### 1.5 `DELETE /api/console/assistants/[assistantId]`

**204** 无 body。删除后会话 `assistant_id` 由 FK 置 NULL，snapshot 保留。

---

## 2. 对话 — 创建会话与列表

### 2.1 `POST /api/chat/sessions`（变更）

**请求体**（可选 JSON；兼容无 body 的旧客户端）

```json
{
  "assistantId": "uuid-or-omit"
}
```

- 省略或 `assistantId` 为空串：与现网一致，仅创建会话，助手列为 NULL。
- 非空：须存在对应 `assistants` 行；创建时写入 `assistant_id` 与 **name/icon/prompt 三列 snapshot**。

**响应 201**（保持）

```json
{ "id": "session-uuid" }
```

**400**：`assistantId` 无效（不存在）。

### 2.2 `GET /api/chat/sessions`（变更）

`SessionSummary` 扩展字段（JSON 蛇形或驼峰与现有一致，建议 **camelCase** 与前端 `SessionListItem` 对齐）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `assistantId` | string \| null | |
| `assistantName` | string \| null | snapshot，用于侧栏/标题 |
| `assistantIcon` | string \| null | snapshot emoji |

**兼容**：旧客户端忽略未知字段即可。

---

## 3. 对话 — 聊天请求（`POST /api/chat`）

**本迭代（session 模式）行为**（实现见 implementation-plan）：

- 根据 `sessionId` 读会话；若存在 **有效助手提示词**（通过 `assistant_id` 联表或仅用 snapshot 不足——**提示词**必须以 `assistants.prompt` 为准，**删助手后**会话内仍使用 **创建时写入的 prompt 快照** 才符合「历史语义不变」）。  

**定稿**：在 `chat_sessions` 增加 **`assistant_prompt_snapshot TEXT NULL`**，创建时复制 `assistants.prompt`；**流式请求**组装 messages 时优先插入一条 `role: system`，内容为 `assistant_prompt_snapshot`（若非空），再衔接现有上下文摘要/历史消息逻辑。

若 PRD 仅要求「删助手后展示名称」而非「保留原提示词行为」，可仅用 `assistants` 表联查，删助手后 fallback 无 system——**本迭代采用 snapshot 列**，与 PRD「不静默改变历史」一致。

**data-models** 须补充 `assistant_prompt_snapshot`（见同目录 data-models 修订）。

---

## 4. 公开列表（可选）

若对话页 Modal 需拉助手列表而不走 console：可 **`GET /api/config/public` 扩展** 或新增 **`GET /api/assistants`**（仅 id、name、icon、quickPhrases，**无 prompt**）。**定稿**：新增 **`GET /api/assistants`**（或 `/api/chat/assistants`），只读，返回最小字段供新建会话 Modal 与快捷语使用。

---

## 5. 错误码约定

| HTTP | 含义 |
|------|------|
| 400 | 参数/JSON 校验失败 |
| 404 | 助手或会话不存在 |
| 500 | 服务器内部错误 |
