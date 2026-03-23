# 知识库数据模型（SQLite，version=0.1.0）

**库文件**：与聊天会话共用路径逻辑（`CHAT_SQLITE_PATH` 或默认 `data/chat.sqlite`），见 `src/lib/knowledge/paths.ts`。

**迁移**：`KnowledgeSqliteStore` 构造时执行 `CREATE TABLE IF NOT EXISTS` 与索引。

---

## `knowledge_bases`

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | TEXT PK | UUID |
| `name` | TEXT UNIQUE NOT NULL | 展示名 |
| `description` | TEXT | 可空 |
| `created_at` | INTEGER | 毫秒 |
| `updated_at` | INTEGER | 毫秒 |

---

## `knowledge_entries`

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | TEXT PK | UUID |
| `base_id` | TEXT FK → knowledge_bases.id ON DELETE CASCADE | 所属库 |
| `title` | TEXT | 可空 |
| `body` | TEXT NOT NULL | 纯文本正文 |
| `index_status` | TEXT NOT NULL | `pending` / `indexing` / `ready` / `failed` |
| `index_error` | TEXT | 可空 |
| `created_at` | INTEGER | 毫秒 |
| `updated_at` | INTEGER | 毫秒 |

索引：`idx_knowledge_entries_base (base_id)`。

---

## `knowledge_chunks`

每个块一行；向量与块同表存储。

| 列 | 类型 | 说明 |
|----|------|------|
| `id` | TEXT PK | UUID |
| `entry_id` | TEXT FK → knowledge_entries.id ON DELETE CASCADE | 所属条目 |
| `chunk_index` | INTEGER NOT NULL | 条内序号 |
| `text` | TEXT NOT NULL | 块文本 |
| `char_start` | INTEGER NOT NULL | 相对条目 `body` 的 UTF-16 偏移起点 |
| `char_end` | INTEGER NOT NULL | 相对条目 `body` 的 UTF-16 偏移终点（开区间约定以实现为准） |
| `embedding_model` | TEXT NOT NULL | 模型名 |
| `embedding_dim` | INTEGER NOT NULL | 维度 |
| `embedding` | BLOB NOT NULL | float32 小端序，已 L2 归一化 |

索引：`idx_knowledge_chunks_entry (entry_id)`。

---

## 删除语义

- 删库：外键级联删除该库下所有条目、块（含向量）。
- 更新条目正文：先删除该条目下全部 `knowledge_chunks`，再写入新块与向量。
