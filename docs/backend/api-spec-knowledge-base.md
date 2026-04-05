# 知识库管理 API（version=0.1.0）

**基路径**：`/api/console/knowledge`  
**运行时**：`nodejs`；**缓存**：`force-dynamic`。

所有 JSON 响应在错误时可能包含 `{ "error": string }`。

---

## `GET /api/console/knowledge`

列出知识库。

**响应 200**：`{ "bases": KnowledgeBase[] }`

`KnowledgeBase`：`id`, `name`, `description`, `createdAt`, `updatedAt`, `entryCount`（毫秒时间戳，camelCase）。

---

## `POST /api/console/knowledge`

新建知识库。

**请求体**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 必填，trim 后 1～120 字符 |
| `description` | string | 可选，trim 后可为空 |

**响应 200**：`{ "base": KnowledgeBase }`  
**400**：校验失败或无效 JSON  
**409**：名称唯一冲突（`知识库名称已存在`）

---

## `GET /api/console/knowledge/[baseId]`

库详情及文档列表。

**响应 200**：`{ "base": KnowledgeBase, "entries": KnowledgeEntry[] }`  
**404**：库不存在

`KnowledgeEntry`：`id`, `baseId`, `title`, `body`, `indexStatus`（`pending` \| `indexing` \| `ready` \| `failed`）, `indexError`, `createdAt`, `updatedAt`。

---

## `PATCH /api/console/knowledge/[baseId]`

更新库名称或描述（至少一项）。

**请求体**：`name?` string；`description?` string。未出现的字段不更新；传空字符串时描述会被置为 `null`。

**响应 200**：`{ "base": KnowledgeBase }`  
**400**：无更新字段或校验失败  
**404** / **409**：同 POST

---

## `DELETE /api/console/knowledge/[baseId]`

删除库（级联删除文档、块、向量）。

**响应 200**：`{ "ok": true }`  
**404**：库不存在

---

## `POST /api/console/knowledge/[baseId]/entries`

新建文本文档并触发索引。

**请求体**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string \| null | 可选，0～200 字符 |
| `body` | string | 必填，trim 后 1～100_000 字符 |

**响应 200**：`{ "entry": KnowledgeEntry }`  
**400** / **404**：校验失败或库不存在

---

## `PATCH /api/console/knowledge/[baseId]/entries/[entryId]`

兼容接口：一次 PATCH 可以同时更新 `title` 与 `body`。
其中：**若提供 `body`，会触发重新分块与向量化**；仅提供 `title` 则只更新元信息。

（硬分离更推荐使用下方 `/meta` 与 `/body` 两个接口。）

**请求体**：`title?`、`body?`（至少一项）

**响应 200**：`{ "entry": KnowledgeEntry }`  
**404**：文档不属于该库或不存在

---

## `PATCH /api/console/knowledge/[baseId]/entries/[entryId]/meta`

仅更新文档元信息（标题），不触发向量重建。

**请求体**：`title` string | null

**响应 200**：`{ "entry": KnowledgeEntry }`  
**404**：文档不属于该库或不存在

---

## `PATCH /api/console/knowledge/[baseId]/entries/[entryId]/body`

仅更新文档正文，并触发向量重建（重分块 + Embedding）。

**请求体**：`body` string

**响应 200**：`{ "entry": KnowledgeEntry }`  
**404**：文档不属于该库或不存在

---

## `DELETE /api/console/knowledge/[baseId]/entries/[entryId]`

删除文档及关联块与向量。

**响应 200**：`{ "ok": true }`  
**404**：文档不存在

---

## `POST /api/console/knowledge/[baseId]/entries/[entryId]/reindex`

对已有文档重新执行索引（用于失败重试）。

**响应 200**：`{ "entry": KnowledgeEntry }`  
**404**：文档不存在

---

## `POST /api/console/knowledge/[baseId]/search-preview`

管理端试检索（**不**接入对话）。

**请求体**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `query` | string | 必填 |
| `topK` | number | 可选，默认 5，范围 1～20 |

**响应 200**：`{ "hits": SearchHit[] }`

`SearchHit`：`chunkId`, `entryId`, `chunkIndex`, `text`, `charStart`, `charEnd`, `score`。

**404**：库不存在  
**502**：Embedding 或内部错误（错误信息在 `error`）
