# 数据模型：助手（version=0.3.1）

**输入**：`iterations/0.3.1/product/prd-assistant.md`、`iterations/0.3.1/design/spec-assistant.md`

**存储**：与现有聊天库 **同一 SQLite 文件**（`CHAT_SQLITE_PATH` / 默认 `data/chat.sqlite`），由 `migrate()` 幂等追加表与列。

---

## 1. 表 `assistants`

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `name` | TEXT | NOT NULL | 展示名 |
| `prompt` | TEXT | NOT NULL | 助手提示词（注入策略见 `implementation-notes-assistant.md`） |
| `icon_emoji` | TEXT | NULL | emoji；NULL 或空串时前端默认 🤖 |
| `knowledge_base_ids_json` | TEXT | NOT NULL DEFAULT '[]' | JSON 数组；**允许空数组**（不关联任何知识库）；非空时每元素为知识库 `id`，最多 16 个 |
| `quick_phrases_json` | TEXT | NOT NULL DEFAULT '[]' | JSON 数组；**允许空数组**（不配置快捷语）；非空时每条为快捷语字符串，最多 20 条 |
| `created_at` | INTEGER | NOT NULL | Unix ms |
| `updated_at` | INTEGER | NOT NULL | Unix ms |

- **校验**（服务端）：`name` trim 后 1～80；`prompt` 1～32000；`icon_emoji` trim 后长度 0～16；`knowledge_base_ids_json` 解析后为数组即可，**空数组合法**；非空时去重、每项须为已存在知识库 id；`quick_phrases_json` **空数组合法**；非空时每项 trim 后 1～200 字符，去重。

---

## 2. 表 `chat_sessions` 扩展列

| 列 | 类型 | 约束 | 说明 |
|----|------|------|------|
| `assistant_id` | TEXT | NULL，FK → `assistants(id) ON DELETE SET NULL` | 创建会话时写入；助手删除后变 NULL |
| `assistant_name_snapshot` | TEXT | NULL | 创建时从助手复制，**展示** |
| `assistant_icon_snapshot` | TEXT | NULL | 创建时从助手复制（emoji） |
| `assistant_prompt_snapshot` | TEXT | NULL | 创建时从 `assistants.prompt` 复制；**流式对话**注入 system 用；删助手后不丢失语义 |

- **外键**：`ON DELETE SET NULL` 避免删助手时会话行消失；展示依赖 **snapshot**，不依赖 `assistant_id` 仍有效。
- **历史会话**：无助手绑定的旧行，上述四列均为 NULL，行为与现网一致。

---

## 3. 与 `SessionSummary` / API 对外形态

- 列表 `GET /api/chat/sessions` 返回项扩展（见 api-spec）：`assistantId`、`assistantName`、`assistantIcon`、`assistantDeleted`（布尔，当 `assistant_id` 非空但助手行不存在时为 true——实现上可用 LEFT JOIN 或二次查；更简单：**仅依赖 snapshot**，删助手后 `assistant_id` 置 NULL 后仍保留 snapshot，则 **无需** `assistantDeleted`；若采用「删助手时不清 snapshot」则 `assistant_deleted` 可由 `assistant_id IS NULL AND assistant_name_snapshot IS NOT NULL` 推断为「曾绑定已删」——**定稿**：删助手时 **不** 清空 snapshot 列，仅 `assistant_id` SET NULL；**无**单独 `assistant_deleted` 列，前端用「`assistant_id` 空且 snapshot 有值」表示「助手已删除」或统一用 snapshot 展示（名称可显示为快照 + 小字「已删除」）。  

**简化定稿（推荐）**：

- 创建会话时写入 **id + name/icon/prompt 三段 snapshot**。
- 删除助手时：仅删除 `assistants` 行；FK 将会话的 `assistant_id` **置 NULL**；**各 snapshot 列不修改**。
- 前端：展示用 name/icon；「助手已删除」：`assistant_id === null` 且（`assistant_name_snapshot` 非空 **或** 曾绑定——等价于看 `assistant_prompt_snapshot` 非空亦可）。

**注意**：旧会话无 assistant 列时，迁移后全为 NULL。

---

## 4. 知识库引用完整性

- 删除知识库时：**不** 级联更新 `assistants.knowledge_base_ids_json`（避免重扫）；允许助手 JSON 中残留无效 id；**保存助手**时过滤无效 id；**列表 API** 可返回 `invalidKnowledgeBaseCount` 供管理端展示（可选）。

---

## 5. 索引

- `CREATE INDEX IF NOT EXISTS idx_chat_sessions_assistant_id ON chat_sessions(assistant_id);`（可选，便于统计）
