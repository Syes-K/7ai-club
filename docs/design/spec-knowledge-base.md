# 设计说明：知识库 — 管理、分块与向量化（version=0.1.0）

**输入需求**：`iterations/0.1.0/product/prd-knowledge-base-management.md`、`user-stories-knowledge-base-management.md`

---

## 1. 设计决策总览

| PRD / 项 | 定稿 |
|----------|------|
| D1 信息架构 | 侧栏 **「知识库」** → **`/console/knowledge`** 列表；点击库进入 **`/console/knowledge/[baseId]`** 条目与索引相关操作。 |
| D2 删除与索引 | 删库 `confirm` 文案须含 **「将删除库内全部条目及已生成向量」**；删条目同理（或简化为「条目及对应向量」）。条目保存后 **同步索引**（见 §6）；失败时条目展示 **索引失败** 状态与错误摘要。 |
| D3 视觉 | 与 **ConsoleConfigForm / PromptTemplatesForm** 一致：`max-w-*` 卡片、`violet` 主按钮、`zinc` 背景与边框、成功/错误提示条。 |
| D4 空状态 | 无库：引导 **新建知识库**；无条目：引导 **添加文本条目**；索引失败：红色或 amber 条 + 可 **重试索引**（按钮由后端提供接口后接）。 |
| D5 试检索（可选） | **首版建议做**：在 **库详情页底部** 增加折叠区 **「检索试查（调试用）」**：单行查询 + `topK`（默认 5）+ 按钮，调用 **仅管理端** API，展示命中块文本片段列表（**不**进入对话）。 |
| 模块边界 | 业务逻辑在 **`src/lib/knowledge/`**（可分子目录 `store/`、`chunk/`、`embed/`、`search/`）；**`src/app/api/chat/` 不出现** 上述实现。 |
| 范围说明条 | 库列表页顶或详情页顶：**「当前版本已向量化知识内容，尚未在对话中启用检索；文件上传后续提供。」**（`text-sm`，`zinc-600` / `dark:zinc-400`） |

---

## 2. 路由与导航

| 路径 | 页面职责 |
|------|----------|
| `/console/knowledge` | 知识库列表；新建库；跳转详情。 |
| `/console/knowledge/[baseId]` | 库名称展示与返回列表；条目表格；新建/编辑条目（抽屉或独立表单区）；可选试检索区。 |

- **`ConsoleProShell`**：`route.routes` 增加 **「知识库」**，`path: "/console/knowledge"`，图标建议 **`BookOutlined`** 或 **`DatabaseOutlined`**。  
- **`PAGE_TITLE`**：`/console/knowledge` → `知识库`；`/console/knowledge/*` 子路径 → **`知识库详情`**（或与库名合并由实现读取数据后设置 document title 为可选增强）。

---

## 3. 字段与校验（条目）

| 字段 | 规则 | 控件 |
|------|------|------|
| **标题** | 可选；trim 后长度 **0～200**（字符数与 JS `length` 一致） | 单行 `input` |
| **正文** | **必填**；trim 后 **1～100_000** 字符；仅纯文本（无富文本、无上传） | `textarea`，`font-mono text-sm`，可 `resize-y`，`rows` 10+ |

- 保存前前端可做基础校验；**以服务端为准**。  
- **库名称**：必填；trim 后 **1～120** 字符；同库重命名冲突策略：**拒绝重名**（后端唯一约束）。

---

## 4. 列表与表格展示

### 4.1 知识库列表

- 列建议：**名称**、**描述**（可选，截断）、**条目数**、**更新时间**、操作 **进入 / 重命名 / 删除**。  
- **新建**：主按钮或卡片顶 **「新建知识库」** → 弹窗或内联表单（名称 + 可选描述）。

### 4.2 条目列表（库详情）

- 列建议：**标题**（无则显示「（无标题）」）、**正文预览**（前 80 字…）、**索引状态**（`就绪` / `索引中` / `失败`）、**更新时间**、操作 **编辑 / 删除**。  
- **索引中**：保存后至索引完成前可显示 **索引中…**（若同步索引则可能极短；仍保留状态字段便于后续改异步）。

---

## 5. 数据模型（概念层，供后端定表）

| 实体 | 主要字段 |
|------|----------|
| **知识库** | `id`，`name`，`description`（可空），`created_at`，`updated_at` |
| **条目** | `id`，`base_id`，`title`（可空），`body`，`index_status`（`pending` \| `indexing` \| `ready` \| `failed`），`index_error`（可空），`updated_at` |
| **块** | `id`，`entry_id`，`chunk_index`，`text`，`char_start`，`char_end`（相对条目 `body` 的偏移，便于调试展示） |
| **向量** | 与 **块一行一向量**；存 **维度**、**模型名**、**向量 BLOB**（`float32` 小端序）或后端选定等价存储 |

- **删除库**：级联删除条目、块、向量。  
- **更新条目**：先删该条目下旧块与向量，再分块与重新写入。

---

## 6. 分块、Embedding、向量（设计约束）

### 6.1 分块策略（首版）

- **按字符滑动窗口**（与 PRD 一致：实现用 **JavaScript 字符串索引**，即 UTF-16 码元；文档对用户仍写「字符」）。  
- **参数**（首版可在应用配置中设置；默认）：**块长 512**、**重叠 64**。  
- 对应应用配置字段：`knowledgeChunkSize`、`knowledgeChunkOverlap`。
- **边界**：优先在 `\n\n`、`\n`、顿号/句号类标点处尝试断开，避免硬切 mid-word（实现细则见后端）；若无法满足则硬切。  
- **短文本**：长度不足一块时 **单块** 全文。

### 6.2 Embedding

- **协议**：**OpenAI 兼容** `POST /v1/embeddings`（`input` 为字符串或数组）。  
- **配置**（环境变量，首版）：  
  - `KNOWLEDGE_EMBEDDING_BASE_URL`（可选，缺省 `https://api.openai.com/v1`）  
  - `KNOWLEDGE_EMBEDDING_API_KEY`（必填方可写入向量；缺省时保存条目成功但 `index_status=failed` 并提示）  
  - `KNOWLEDGE_EMBEDDING_MODEL`（默认 `text-embedding-3-small` 或与服务商一致）  
- **批处理**：单条目多块时可 **批量 embedding** 减少请求次数（上限由后端控制）。

### 6.3 向量检索（试检索与后续 RAG 共用）

- **相似度**：**余弦相似度**；向量须 **L2 归一化** 后可用点积（由后端统一约定）。  
- **首版规模**：单机、单库条目有限，允许 **暴力扫全库块向量**；模块内封装 `searchChunks({ baseId, queryVector, topK })` 供试检索与后续对话迭代复用。

### 6.4 索引时机

- **首版**：条目 **创建/更新** 后，在 **同一请求链路内** 完成删旧块 → 分块 → embedding → 写库（避免引入队列复杂度）。若耗时过长可再迭代改为异步 + 轮询状态。  
- **失败**：`index_status=failed`，`index_error` 存简短英文或中文错误信息；UI 展示 + **重试**（重新触发索引）。

---

## 7. API 形态（供后端实现）

- 管理 CRUD：`/api/console/knowledge/...` 路径族（具体 REST 形状见 **backend api-spec**）。  
- **禁止**在 `POST /api/chat` 内写知识库逻辑；试检索为 **`POST /api/console/knowledge/[baseId]/search-preview`**（仅管理端使用，与 console 同鉴权假设）。

---

## 8. 模块目录（建议）

```
src/lib/knowledge/
  index.ts              # 对外稳定 API（CRUD 编排、indexEntry、searchPreview）
  store/                # SQLite 访问、迁移
  chunk.ts              # 分块纯函数
  embed.ts              # HTTP 调用 embedding
  vector.ts             # 序列化、相似度
  search.ts             # topK 检索
```

---

## 9. 用户故事映射

| 故事 | 设计落点 |
|------|----------|
| US-0.1.0-1 | §2 导航与 `ConsoleProShell` |
| US-0.1.0-2 | §4.1、§5、删库确认 §1 |
| US-0.1.0-3 | §3、§4.2、§6 |
| US-0.1.0-4 | §1、§7、§8 |
| US-0.1.0-5 | §1 范围说明条 |

---

## 10. 与后端交接

- 输出 **`iterations/0.1.0/backend/`** 下 **api-spec**、**data-models**、**implementation-notes**（由后端阶段编写）；本设计文档为输入。  
- **SQLite 迁移**：新表与现有 `chat` 库文件共存策略（同文件或分文件）由后端定稿，须在 implementation-notes 写明路径。

---

## 11. 文档路径

- 迭代：`iterations/0.1.0/design/spec-knowledge-base.md`  
- 同步：`docs/design/spec-knowledge-base.md`
