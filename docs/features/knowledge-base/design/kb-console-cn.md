# 知识库 — Console UI 与 API

> **English:** [kb-console.md](./kb-console.md)  
> **中文：** [kb-console-cn.md](./kb-console-cn.md)  
> **总纲：** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **PRD：** [prd/kb-management-cn.md](../prd/kb-management-cn.md) · [prd/kb-recall-test-cn.md](../prd/kb-recall-test-cn.md)  
> **迭代：** iter-09

---

## 1. 设计目标

- 替换 `/console/knowledge` 占位页
- 列表 + 创建 dialog + 详情（编辑 + 召回测试）
- API 处理含 Key/Storage 的写操作；列表读可走 browser Supabase

---

## 2. 路由

```
app/console/knowledge/
  page.tsx              # Server: 可选预加载 → KnowledgeBasesManager
  loading.tsx           # ConsolePageLoading
  [id]/page.tsx         # KB 详情 + Recall test
```

**决策：** 创建用 **modal dialog**（仿 Assistants），不单独 `/new` 路由 — 减少页面数，与现有 Console 一致。

---

## 3. API

| 方法 | 路径 | 说明 | maxDuration |
|------|------|------|-------------|
| POST | `/api/knowledge` | 创建 KB + Storage 上传 + `after(ingest)` | **300** |
| GET | `/api/knowledge/[id]` | 详情（含 status） | — |
| PATCH | `/api/knowledge/[id]` | 更新 name/description | — |
| DELETE | `/api/knowledge/[id]` | RPC delete；409 | — |
| POST | `/api/knowledge/[id]/ingest` | Retry ingest | 300 |
| POST | `/api/knowledge/[id]/recall-test` | body: `{ query }` | 30 |

### 3.1 `POST /api/knowledge`

**Content-Type：** `multipart/form-data`（file）或 `application/json`（text）

**JSON body（text）：**

```json
{
  "name": "Product FAQ",
  "description": "Optional",
  "sourceType": "text",
  "text": "# FAQ\n..."
}
```

**Form fields（file）：** `name`, `description`, `sourceType=file`, `file`

**Response 201：**

```json
{ "id": "uuid", "status": "processing" }
```

**Errors：** 401, 422 validation, 413 file too large, 503 service config

**服务端逻辑：**

1. `getUser()` 鉴权
2. 读 Profile RAG embedding 默认值 → 快照至 row
3. 读 env chunk size/overlap → 快照
4. Insert `knowledge_bases` status=processing
5. File → Storage upload
6. `after(() => runKnowledgeBaseIngest(id))`

### 3.2 `POST /api/knowledge/[id]/recall-test`

```json
// Request
{ "query": "How do I reset password?" }

// Response 200
{
  "hits": [
    {
      "score": 0.82,
      "content": "...",
      "headingPath": "## Account > Reset",
      "charStart": 1200,
      "charEnd": 1450,
      "kbId": "...",
      "kbName": "Product FAQ"
    }
  ]
}
```

- 调用 `lib/rag/retrieve.ts`（单 KB）
- threshold / topK 从 owner profile 读取

---

## 4. 数据层

```
lib/validation/knowledge-base.ts     # zod schemas
lib/data/browser/knowledge-bases.ts  # list, getById (supabase)
lib/services/browser/knowledge-bases.ts # orchestration + API fetch
lib/data/errors.ts                   # kb_in_use → 409
```

**列表查询：**

```typescript
supabase.from("knowledge_bases")
  .select("id,name,description,source_type,source_filename,status,error_message,updated_at")
  .order("updated_at", { ascending: false });
```

---

## 5. 组件

```
components/console/knowledge-bases-manager.tsx   # 列表 + create dialog
components/console/knowledge-base-form.tsx       # 创建/编辑表单
components/console/knowledge-base-detail.tsx     # 详情 + recall test
components/console/recall-test-panel.tsx         # query + results
```

### 5.1 `KnowledgeBasesManager`

- 仿 `AssistantsManager`：`usePageBusy`, `ConsolePage`, `ConsoleTable`
- 列：Name, Description, Source type, Status badge, Updated, Actions
- Status：`Processing` spinner / `Ready` / `Error` + tooltip error_message
- **Polling：** `status === 'processing'` 时每 3s refetch（或 Supabase realtime channel）
- Actions：View, Delete
- Empty → **Create knowledge base**

### 5.2 创建表单

- Radio：**Paste text** | **Upload file**
- Text：textarea
- File：`accept=".md,.txt,.pdf,.docx"`
- Name (required), Description
- Submit → `runBusy("Creating…", () => createKnowledgeBase(...))`

### 5.3 详情页

- 编辑 Name/Description（Save 独立 busy）
- Source 只读：filename 或 text preview（前 500 字符）
- Error 态：**Retry ingestion** → POST ingest
- **Recall test panel**（仅 ready）

### 5.4 Recall test UI

| 元素 | 说明 |
|------|------|
| Query textarea | |
| **Run recall test** | disabled when not ready |
| Results | 卡片列表：Score, Location, Content (expand) |
| Empty | *No results above the confidence threshold.* |

---

## 6. Loading UX

- 列表：`app/console/knowledge/loading.tsx`
- Create/Delete/Save/Recall：`usePageBusy` 全页遮罩
- 文案 English：`Creating…`, `Deleting…`, `Running recall test…`

---

## 12. PRD 验收映射

| AC ID | 实现要点 | 验证方式 |
|-------|----------|----------|
| AC-90 | 表单 + POST API | e2e |
| AC-91 | 列表 status + polling | e2e |
| AC-93 | RecallTestPanel + API | e2e + manual |
| AC-99 | Delete 409 + Retry button | e2e |

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-30 | 初稿 |
