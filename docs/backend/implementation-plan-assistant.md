# 实现计划：助手（version=0.3.1）

**输入**：`data-models-assistant.md`、`api-spec-assistant.md`、`implementation-notes-assistant.md`（实现说明）、设计 `spec-assistant.md`

---

## 1. 实现顺序（建议）

1. **SQLite 迁移**：`assistants` 表 + `chat_sessions` 四列（`assistant_id`、`assistant_name_snapshot`、`assistant_icon_snapshot`、`assistant_prompt_snapshot`）。  
2. **`ChatStore` 端口**：扩展 `SessionSummary`、`createSession(opts?)`、`listSessions` 返回字段；迁移 `SqliteChatStore`。  
3. **`/api/chat/sessions`**：`POST` 解析 body `assistantId`；`GET` 返回扩展字段。  
4. **助手存储模块**：`src/lib/assistants/`（或 `src/lib/chat/assistants/`）封装 CRUD + JSON 校验；**不**在 `api/chat` 内写大段 SQL。  
5. **`/api/console/assistants*`**：路由与校验。  
6. **`GET /api/assistants`**（或约定路径）：只读列表，供对话 Modal（无 prompt）。  
7. **`POST /api/chat`（session 模式）**：在组装发往模型的 `messages` 前，若 `assistant_prompt_snapshot` 非空，**前置一条** `role: system`、`content` 为快照全文；与 `context_summary`、历史消息的顺序须 **单次定稿**（建议：`[system 助手] → [system 摘要若有] → [历史 user/assistant…]`，摘要与助手冲突时以 **后端文档本节为准**：**助手 system 在前**，摘要仍用现有 `CONTEXT_SUMMARY` 前缀逻辑——若与现 `buildMessagesWithContextSummary` 冲突，在实现中合并为一条 system 或按产品确认；**最小改动**为 **先插助手 system，再跑现有摘要逻辑**）。  
8. **知识库与对话**：助手可不关联任何知识库（`[]`）；`knowledge_base_ids_json` **本迭代可仅存储**；若当前工程 **尚未** 在 `/api/chat` 内按会话做 RAG，则 **不调用** `searchChunks`；在 `implementation-notes` 与 PRD 已对齐「可后续迭代」。快捷语亦可 **0 条**，前端不展示快捷区。  
9. **前端**（阶段 4）：控制台页面 + ChatApp Modal + 快捷语（依赖 6 的 API）。

---

## 2. 风险与缓解

| 风险 | 缓解 |
|------|------|
| system 条数过多导致 token 爆 | 助手 prompt 长度已在保存时限制；与 `maxMessagesInContext` 独立，必要时后续做截断。 |
| 双 system（助手 + 摘要） | 见 §1 顺序；或合并为一条 system（实现时选最小侵入）。 |
| 旧客户端 `POST /api/chat/sessions` 无 body | 保持 body 可选，默认无助手。 |

---

## 3. 自测清单（服务端）

- [ ] 迁移后旧会话可读，新列 NULL。  
- [ ] 创建会话带合法 `assistantId`，四列快照正确。  
- [ ] 非法 `assistantId` → 400。  
- [ ] 删除助手后会话仍可读，`assistant_id` NULL，snapshot 仍在，`POST /api/chat` 仍带助手 system。  
- [ ] 助手 CRUD 与知识库 id 校验。  
- [ ] `GET /api/assistants` 不含 `prompt`。

---

## 4. 与现有模块边界

- **意图路由 / legacy**：不受影响；**session 模式**走助手逻辑。  
- **知识库检索**：助手关联的 `knowledge_base_ids_json` 由 **`src/lib/knowledge/`** 检索 API 消费（后续迭代）；本迭代仅存储。
