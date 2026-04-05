# 助手实现说明（version=0.3.1）

**关联文档**：[`data-models-assistant.md`](./data-models-assistant.md)、[`api-spec-assistant.md`](./api-spec-assistant.md)、[`implementation-plan-assistant.md`](./implementation-plan-assistant.md)（实现顺序清单）

---

## 1. 模块位置

| 职责 | 路径（建议） |
|------|----------------|
| 助手领域逻辑与 SQLite CRUD | `src/lib/assistants/`（`store.ts` / `sqlite-store.ts`、校验、类型） |
| 聊天会话扩展 | `src/lib/chat/store/`（`port.ts`、`sqlite-store.ts` 迁移与查询） |
| 管理端 HTTP | `src/app/api/console/assistants/`、`[assistantId]/` |
| 对话只读列表 | `src/app/api/assistants/route.ts`（或 `src/app/api/chat/assistants/route.ts`，与 api-spec 定稿一致） |
| 会话创建/列表变更 | `src/app/api/chat/sessions/route.ts` |
| Session 模式消息组装 | `src/lib/chat/`（`context-summary`、`run-chat-stream` 或 `validate-request` 调用链）：在现有 **system / 摘要 / 历史** 逻辑中 **插入助手 system**（见 §3） |

**边界**：助手业务 **不** 写在 `api/chat/route.ts` 内联 SQL；通过 `getAssistantStore()` / `ChatStore` 组合调用。

---

## 2. HTTP 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/console/assistants` | 列表 / 新建 |
| GET/PUT/DELETE | `/api/console/assistants/[assistantId]` | 详情 / 更新 / 删除 |
| GET | `/api/assistants`（或约定名） | 公开只读列表，**无** `prompt` |
| POST | `/api/chat/sessions` | Body 可选 `{ assistantId }`，写入快照 |
| GET | `/api/chat/sessions` | 响应项扩展 `assistantId`、`assistantName`、`assistantIcon` |

详见 [`api-spec-assistant.md`](./api-spec-assistant.md)。

---

## 3. 与对话消息组装（session 模式）

- 读取会话行，若 **`assistant_prompt_snapshot`** 非空，在发往模型的 `messages` 中 **前置**一条 `{ role: "system", content: snapshot }`。  
- **与上下文摘要**：现有 `buildMessagesWithContextSummary` 若已插入 `role: system` 的摘要，顺序建议：**先助手 system，再摘要 system**（或合并为一条，以实现时改动最小为准）；须与 `implementation-plan-assistant.md` §1 步 7 一致。  
- **Legacy / 意图路由**：不读助手字段，行为不变。

---

## 4. 知识库与 RAG

- `knowledge_base_ids_json` **允许 `[]`**；本迭代 **可仅持久化**，不在 `POST /api/chat` 内根据助手调用 `searchChunks`；后续迭代对接时在 **`src/lib/knowledge/`** 侧扩展，见 PRD。

---

## 5. 迁移与兼容

- `migrate()` 幂等：`CREATE TABLE assistants ...`；`ALTER TABLE chat_sessions ADD COLUMN ...` 四列；`FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE SET NULL`（若 SQLite 版本/ pragma 与现网一致）。  
- 旧客户端：`POST /api/chat/sessions` **无 body** 视为无助手。

---

## 6. 本迭代不包含

- 按助手 **多库 RAG**、流式引用来源。  
- 助手 **草稿/版本**、**权限模型**。  
- 修改已创建会话的 `assistant_id`（API 与 UI 均禁止）。
