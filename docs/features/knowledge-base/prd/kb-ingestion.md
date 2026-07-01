# Knowledge base ingestion (parse / chunk / embed)

> **English:** [kb-ingestion.md](./kb-ingestion.md)  
> **中文:** [kb-ingestion-cn.md](./kb-ingestion-cn.md)  
> **Overview:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-09

---

## 1. Scope

F-91 — **Async ingest pipeline** after KB create: parse → hybrid chunk → embed → Supabase pgvector.

---

## 2. User stories

| ID | Story | Priority |
|----|-------|----------|
| US-94 | As a user, I want pdf/docx auto-converted for retrieval | P0 |
| US-95 | As a user, I want sensible chunking and embeddings for accurate recall | P0 |

---

## 3. F-91 Ingest pipeline

### 3.1 Trigger & execution

Async job on create or **Retry ingestion**. Not in chat route. One active ingest per KB (tech design defines queue/cancel).

### 3.2 Parsing

| Source | Handling |
|--------|----------|
| `.md` / `.txt` / Text | UTF-8; normalize to Markdown text |
| `.pdf` / `.docx` | [`doc-to-md-rag`](https://www.npmjs.com/package/doc-to-md-rag) v1.x → Markdown |
| Unsupported | `error` status |

### 3.3 Hybrid chunking (A + B)

1. **Structure (B):** Split on Markdown headings and paragraph breaks  
2. **Token window (A):** Sliding window when segment exceeds env `RAG_CHUNK_SIZE`  
3. **Overlap:** env `RAG_CHUNK_OVERLAP` between adjacent chunks  

Chunk metadata: `kb_id`, index, heading path, char/line range, content, embedding vector.

### 3.4 Embedding

Model locked at KB create. Default from env `RAG_EMBEDDING_PROVIDER` / `RAG_EMBEDDING_MODEL`. Retry clears old chunks and re-runs pipeline.

### 3.5 State machine

`processing` → `ready` | `error`; `error` → `processing` on Retry.

### 3.6 Env vars

`RAG_CHUNK_SIZE`, `RAG_CHUNK_OVERLAP`, `RAG_EMBEDDING_PROVIDER`, `RAG_EMBEDDING_MODEL`.

---

## 4. Acceptance criteria

- [ ] **AC-91** — Supported formats reach Ready  
- [ ] **AC-92** — Env chunk settings apply to new ingests  
- [ ] **AC-99** — Error + Retry  

---

## 5. Revision history

| Date | Change |
|------|--------|
| 2026-06-30 | iter-09 initial |
