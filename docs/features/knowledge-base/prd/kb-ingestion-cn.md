# 知识库入库（解析 / 分片 / 向量化）

> **English:** [kb-ingestion.md](./kb-ingestion.md)  
> **中文：** [kb-ingestion-cn.md](./kb-ingestion-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-09

---

## 1. 范围

F-91 — KB 创建后的 **异步入库流水线**：文档解析 → 混合分片 → Embedding → 写入 Supabase pgvector。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-94 | 作为用户，我希望上传 pdf/docx 后自动转为可检索文本，以便无需手动转换 | P0 |
| US-95 | 作为用户，我希望文档被合理分片并向量化，以便 Chat 召回准确 | P0 |

---

## 3. F-91 入库流水线

### 3.1 触发与执行

| 项 | 规则 |
|----|------|
| 触发 | KB 创建成功或用户点击 **Retry ingestion** |
| 执行 | **异步 job**（Supabase Edge Function 或 Next.js 后台任务 — 技术设计定） |
| Chat route | **不参与** 入库 |
| 并发 | 同一 KB 同时仅一个 ingest job（Retry 取消或排队 — 技术设计定） |

### 3.2 解析

| Source | 处理 |
|--------|------|
| `.md` / `.txt` / Text 模式 | UTF-8 读取；归一化为 Markdown 文本 |
| `.pdf` / `.docx` | npm [`doc-to-md-rag`](https://www.npmjs.com/package/doc-to-md-rag)（v1.x）转为 Markdown |
| 不支持格式 | 标记 `error`，摘要说明（English） |

解析产物持久化（原文或 Markdown — 技术设计定），供召回测试展示「所在位置」。

### 3.3 混合分片

**策略 A + B（产品已决）：**

1. **结构边界（B）：** 优先按 Markdown 标题（`#`–`######`）与空行段落切分  
2. **Token 窗口（A）：** 单段超过 env `RAG_CHUNK_SIZE`（token 或字符 — 技术设计定）时，滑动窗口切分  
3. **Overlap：** 相邻 chunk 重叠 env `RAG_CHUNK_OVERLAP`  

每个 chunk 存储元数据（至少）：

- `kb_id`
- `chunk_index`
- `heading_path` 或等效位置（如 `## Installation > ### Prerequisites`）
- `char_start` / `char_end` 或 `line_start` / `line_end`（供 UI 展示来源）
- `content`（文本）
- `embedding`（pgvector）

### 3.4 向量化

| 项 | 规则 |
|----|------|
| 模型 | KB 创建时锁定的 embedding provider + model |
| 凭证 | 服务端；与 Chat LLM 相同 provider 体系（技术设计对齐 Models 页） |
| 默认 | 环境变量 `RAG_EMBEDDING_PROVIDER`、`RAG_EMBEDDING_MODEL`（及对应 API Key） |
| 写入 | Supabase pgvector；RLS 与 KB 同行隔离 |
| Retry | 清除旧 chunks 后重新 parse → chunk → embed |

### 3.5 状态机

```
processing → ready   (全部 chunk embed 成功)
processing → error   (解析/嵌入失败，写入 error_message)
error      → processing  (用户 Retry)
```

### 3.6 环境变量（产品层命名）

| 变量 | 用途 | 示例默认 |
|------|------|----------|
| `RAG_CHUNK_SIZE` | 最大 chunk 大小 | 技术设计定（如 512 tokens） |
| `RAG_CHUNK_OVERLAP` | chunk 重叠 | 技术设计定（如 64 tokens） |
| `RAG_EMBEDDING_PROVIDER` | 默认 embedding 供应商 | 如 `openai` |
| `RAG_EMBEDDING_MODEL` | 默认 embedding 模型 | 如 `text-embedding-3-small` |

---

## 4. 验收标准

- [ ] **AC-91** — md/txt/pdf/docx 入库后状态 Ready  
- [ ] **AC-92** — 修改 env chunk size / overlap 后新 ingest 生效  
- [ ] **AC-99** — 失败为 Error；Retry 可恢复  

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-30 | iter-09 初稿 |
