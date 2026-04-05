# 知识库实现说明（version=0.1.0）

## 模块位置

- **领域逻辑**：`src/lib/knowledge/`（`chunk`、`vector`、`embed`、`store/sqlite-store`、`pipeline`、校验与类型）。
- **HTTP**：`src/app/api/console/knowledge/**`（**不**在 `api/chat` 内实现检索或写入）。

## 分块

- 滑动窗口默认 **512** 字符、重叠 **64**（UTF-16 码元，与 `String` 索引一致）。
- 可在应用配置 `app-config.json` 中通过 `knowledgeChunkSize`、`knowledgeChunkOverlap` 调整（同一文档更新会按新配置重新切分并重建向量）。
- 实现见 `src/lib/knowledge/chunk.ts`。

## 向量与检索

- Embedding 为 OpenAI 兼容 `POST {baseUrl}/embeddings`；向量在写入前 **L2 归一化**；检索使用 **点积**（与余弦等价）。
- 首版检索为 **暴力 topK**（内存中比对），数据量增大后可换向量索引。

## 环境变量

| 变量 | 说明 |
|------|------|
| `KNOWLEDGE_EMBEDDING_API_KEY` | 必填，否则索引失败 |
| `KNOWLEDGE_EMBEDDING_BASE_URL` | 可选；与下方应用配置项并存时 **环境变量优先** |
| `KNOWLEDGE_EMBEDDING_MODEL` | 可选；与下方应用配置项并存时 **环境变量优先** |

应用配置（`app-config.json`，后台「应用配置」页）：`embeddingApiBaseUrl`、`embeddingModel`（均可选、可空）。优先级：`KNOWLEDGE_EMBEDDING_*` 环境变量 > 应用配置 > 内置默认（`https://api.openai.com/v1`、`text-embedding-3-small`）。API Key 仍仅来自 `KNOWLEDGE_EMBEDDING_API_KEY`。

单批嵌入条数上限：`EMBED_BATCH_MAX`（默认 20，见 `embed.ts`）。

## 单例

- `getKnowledgeStore()`：进程内单例 SQLite 连接/存储，避免重复打开库文件。

## 管理端 UI

- 路由：`/console/knowledge`、`/console/knowledge/[baseId]`。
- 侧栏：`ConsoleProShell` 增加「知识库」入口。
- 设计对照：`iterations/0.1.0/design/spec-knowledge-base.md`。

## 文档更新（硬分离）

- 标题/元信息更新：`PATCH /api/console/knowledge/[baseId]/entries/[entryId]/meta`，只改 `title`，不触发向量重建。
- 正文更新：`PATCH /api/console/knowledge/[baseId]/entries/[entryId]/body`，改 `body` 后触发重分块与 Embedding。
- 兼容接口：`PATCH /api/console/knowledge/[baseId]/entries/[entryId]` 仍可同时传 `title/body`（其中若包含 `body` 则会重索引）。

## 本迭代不包含

- 对话侧 RAG、上传文件、异步队列型索引（当前为请求路径内同步索引，失败落 `failed` + `index_error`）。
