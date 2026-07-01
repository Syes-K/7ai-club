# 知识库 — 数据库与 RPC

> **English:** [kb-schema.md](./kb-schema.md)  
> **中文：** [kb-schema-cn.md](./kb-schema-cn.md)  
> **总纲：** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **PRD：** [prd/kb-management-cn.md](../prd/kb-management-cn.md) · [prd/kb-ingestion-cn.md](../prd/kb-ingestion-cn.md)  
> **迭代：** iter-09

---

## 1. 设计目标

- 启用 **pgvector**；KB、chunk、assistant 绑定表 + RLS
- `delete_knowledge_base` RPC（绑定检查 → 409）
- Profile RAG 字段；Storage bucket 策略

---

## 2. Migration 概要

文件：`supabase/migrations/20260630000000_iter09_knowledge_base.sql`

### 2.1 Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
```

Supabase 项目若已启用 vector，保持 `extensions.vector` 类型引用。

### 2.2 `knowledge_bases`

```sql
CREATE TABLE public.knowledge_bases (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 64),
  description           TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  source_type           TEXT NOT NULL CHECK (source_type IN ('text', 'file')),
  -- text source
  source_text           TEXT,
  -- file source
  source_filename       TEXT,
  source_mime           TEXT,
  storage_path          TEXT,
  parsed_markdown       TEXT,
  status                TEXT NOT NULL DEFAULT 'processing'
                        CHECK (status IN ('processing', 'ready', 'error')),
  error_message         TEXT CHECK (error_message IS NULL OR char_length(error_message) <= 500),
  embedding_provider    TEXT NOT NULL,
  embedding_model       TEXT NOT NULL,
  embedding_dimensions  INT NOT NULL DEFAULT 1024,
  chunk_size_tokens     INT NOT NULL,
  chunk_overlap_tokens  INT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kb_source_check CHECK (
    (source_type = 'text' AND source_text IS NOT NULL AND storage_path IS NULL)
    OR (source_type = 'file' AND storage_path IS NOT NULL AND source_filename IS NOT NULL)
  )
);

CREATE INDEX knowledge_bases_user_id_idx ON public.knowledge_bases (user_id);
CREATE INDEX knowledge_bases_user_status_idx ON public.knowledge_bases (user_id, status);

CREATE TRIGGER knowledge_bases_updated_at
  BEFORE UPDATE ON public.knowledge_bases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

**说明：**

- `embedding_*` 在 **创建时** 从用户 Preferences（或 env 默认）快照
- `chunk_size_tokens` / `chunk_overlap_tokens` 在 ingest 开始时快照 env，便于审计
- `parsed_markdown` 存解析后全文，供 recall 展示 location 与 debug

### 2.3 `knowledge_base_chunks`

```sql
CREATE TABLE public.knowledge_base_chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_id           UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  chunk_index     INT NOT NULL,
  content         TEXT NOT NULL,
  heading_path    TEXT,
  char_start      INT NOT NULL,
  char_end        INT NOT NULL,
  embedding       extensions.vector(1024) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kb_chunks_unique_index UNIQUE (kb_id, chunk_index)
);

CREATE INDEX knowledge_base_chunks_kb_id_idx ON public.knowledge_base_chunks (kb_id);

-- IVFFlat or HNSW — MVP 使用 HNSW（数据量小）
CREATE INDEX knowledge_base_chunks_embedding_idx
  ON public.knowledge_base_chunks
  USING hnsw (embedding extensions.vector_cosine_ops);
```

**向量搜索 RPC**（SECURITY INVOKER，按 kb_id 过滤）：

```sql
CREATE OR REPLACE FUNCTION public.match_knowledge_base_chunks(
  p_kb_ids uuid[],
  p_query_embedding extensions.vector(1024),
  p_match_count int,
  p_min_score float
)
RETURNS TABLE (
  kb_id uuid,
  chunk_id uuid,
  content text,
  heading_path text,
  char_start int,
  char_end int,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.kb_id,
    c.id,
    c.content,
    c.heading_path,
    c.char_start,
    c.char_end,
    1 - (c.embedding <=> p_query_embedding) AS similarity
  FROM public.knowledge_base_chunks c
  JOIN public.knowledge_bases kb ON kb.id = c.kb_id
  WHERE c.kb_id = ANY(p_kb_ids)
    AND kb.user_id = auth.uid()
    AND kb.status = 'ready'
    AND (1 - (c.embedding <=> p_query_embedding)) >= p_min_score
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
```

### 2.4 `assistant_knowledge_bases`

```sql
CREATE TABLE public.assistant_knowledge_bases (
  assistant_id  UUID NOT NULL REFERENCES public.assistants(id) ON DELETE CASCADE,
  kb_id         UUID NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (assistant_id, kb_id)
);

CREATE INDEX assistant_knowledge_bases_kb_id_idx
  ON public.assistant_knowledge_bases (kb_id);
```

`ON DELETE RESTRICT` 防止删 KB 时静默级联；删除走 RPC 显式检查。

### 2.5 `user_profiles` 扩展

```sql
ALTER TABLE public.user_profiles
  ADD COLUMN rag_confidence_threshold NUMERIC(4,3) NOT NULL DEFAULT 0.75
    CHECK (rag_confidence_threshold > 0 AND rag_confidence_threshold <= 1),
  ADD COLUMN rag_top_k INT NOT NULL DEFAULT 5
    CHECK (rag_top_k >= 1 AND rag_top_k <= 50),
  ADD COLUMN rag_embedding_provider TEXT NOT NULL DEFAULT 'siliconflow',
  ADD COLUMN rag_embedding_model TEXT NOT NULL DEFAULT 'BAAI/bge-m3';
```

`embedding_dimensions` 与 `RAG_EMBEDDING_DIMENSIONS` env（默认 **1024**）对齐；MVP pgvector 列维度固定，不支持混维检索。

---

## 3. RLS

| 表 | SELECT | INSERT | UPDATE | DELETE |
|----|--------|--------|--------|--------|
| `knowledge_bases` | `user_id = auth.uid()` | 同左 | 同左 | 同左（或通过 RPC） |
| `knowledge_base_chunks` | via KB owner join | **无** authenticated 策略 | 无 | 无 |
| `assistant_knowledge_bases` | assistant owner | assistant owner | — | assistant owner |

**Chunks 写入：** 仅 **service_role**（ingest job）insert/delete；browser 不直写 chunks。

```sql
-- knowledge_base_chunks: 只读给 owner
CREATE POLICY kb_chunks_select ON public.knowledge_base_chunks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.knowledge_bases kb
      WHERE kb.id = kb_id AND kb.user_id = auth.uid()
    )
  );
```

---

## 4. RPC

### 4.1 `delete_knowledge_base(p_kb_id uuid)`

```sql
-- 模式同 delete_assistant
-- 若 EXISTS assistant_knowledge_bases → RAISE 'kb_in_use:N'
-- DELETE chunks (cascade) + kb row + storage object (app 层或 trigger)
```

应用层 `lib/data/errors.ts` 增加 `kb_in_use` → HTTP 409 映射（仿 `assistant_in_use`）。

### 4.2 `set_assistant_knowledge_bases(p_assistant_id, p_kb_ids uuid[])`

- 校验 assistant 与所有 kb 归属当前用户
- 校验所有 kb `status = 'ready'`
- `DELETE` 旧绑定 + `INSERT` 新绑定（transaction）

---

## 5. Storage

| 项 | 值 |
|----|-----|
| Bucket | `knowledge-base-files`（private） |
| Path | `{user_id}/{kb_id}/{sanitized_filename}` |
| 上传 | 服务端 `createServiceClient().storage.from(...).upload` |
| RLS | Storage policies：`auth.uid()::text = (storage.foldername(name))[1]` |

---

## 6. TypeScript 类型

扩展 `lib/data/types.ts`：

```typescript
export type KnowledgeBaseRow = {
  id: string;
  name: string;
  description: string | null;
  source_type: "text" | "file";
  source_filename: string | null;
  status: "processing" | "ready" | "error";
  error_message: string | null;
  embedding_provider: string;
  embedding_model: string;
  updated_at: string;
};

export type RagHit = {
  kbId: string;
  kbName: string;
  chunkId: string;
  content: string;
  headingPath: string | null;
  charStart: number;
  charEnd: number;
  score: number;
};
```

---

## 12. PRD 验收映射（本模块）

| AC ID | 实现要点 | 验证方式 |
|-------|----------|----------|
| AC-91 | status 字段 + ingest 更新 | e2e + Supabase MCP |
| AC-92 | `chunk_size_tokens` 快照 env | unit + manual |
| AC-99 | RLS policies；`delete_knowledge_base` 409 | e2e + Supabase MCP |
| AC-95 | `assistant_knowledge_bases` + RPC | e2e |

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-30 | 初稿 |
| 2026-06-30 | 默认 1024 维 · SiliconFlow BAAI/bge-m3 |
