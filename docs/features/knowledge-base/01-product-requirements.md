# Knowledge Base RAG — Product requirements overview

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文:** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `knowledge-base`  
> **Iteration:** **`iter-09`** — see [iter-09 README](../../iterations/iter-09/README.md)  
> **Roadmap phase:** 2 — Knowledge base  
> **Status:** **PRD confirmed**  
> **PRD confirmed:** 2026-06-30  
> **Doc version:** v0.1

---

## 1. Executive summary

Give signed-in users end-to-end **Knowledge Base** capability: create/manage KBs in Console (single source: pasted text or md/txt/pdf/docx upload) → async ingestion (parse, hybrid chunking, embed to Supabase pgvector) → recall test; configure recall in Preferences; bind multiple KBs on Assistants; when chatting with a KB-bound assistant, show **Query optimization** and **RAG retrieval** workflow steps and inject retrieved chunks into LLM context. **User-facing UI copy is English.**

---

## 2. Global conventions

### 2.1 Routes

| Path | Page | Auth |
|------|------|------|
| `/console/knowledge` | KB list | Required |
| `/console/knowledge/new` | Create KB (may be dialog per tech design) | Required |
| `/console/knowledge/[id]` | KB detail / edit / recall test | Required |

Replaces iter-03 placeholder at `/console/knowledge`.

### 2.2 Data & isolation

| Item | Convention |
|------|------------|
| Vector store | Supabase **pgvector** |
| Tenancy | Per-user KBs; RLS `user_id = auth.uid()` |
| KB ↔ source | **1 KB = 1 source** (text **or** file, no mixing) |
| Embedding model | **Locked at KB create**; changing Preferences model shows re-embed warning |
| Chunking | **Hybrid:** Markdown structure boundaries + fixed token window; overlap & chunk size via **env vars** |

### 2.3 Ingestion

| Item | Convention |
|------|------------|
| Trigger | **Async job** immediately after create/upload (not in chat route) |
| Parse | pdf/docx → [`doc-to-md-rag`](https://www.npmjs.com/package/doc-to-md-rag); md/txt as-is |
| Status | `processing` → `ready` \| `error`; error supports **Retry** |

### 2.4 Permissions

| Action | Who |
|--------|-----|
| CRUD own KBs | Owner |
| Delete KB bound to assistant | **Forbidden** (HTTP 409, like Assistants) |
| Recall test | Owner; KB `ready` |
| View Chat RAG steps | Conversation owner |

### 2.5 Out of scope (iter-09)

- MCP / Skills nodes  
- Multiple sources per KB  
- KB version history  
- Org-level KB sharing  
- Bulk re-embed all KBs  
- Visual workflow editor  

### 2.6 Non-functional (summary)

| Type | Requirement |
|------|-------------|
| Performance | Recall test & Chat RAG retrieval < 3s (normal network, MVP KB size) |
| Security | RLS; Storage owner-only; no API keys in step summaries |
| Deployment | Ingest job separate from chat route; `runtime = 'nodejs'` |
| Locale | User-facing UI **English** |

### 2.7 Feature index

| ID | Feature | PRD | Iteration |
|----|---------|-----|-----------|
| F-90 | Console KB management | [prd/kb-management.md](./prd/kb-management.md) | iter-09 |
| F-91 | Async ingestion | [prd/kb-ingestion.md](./prd/kb-ingestion.md) | iter-09 |
| F-92 | Recall test | [prd/kb-recall-test.md](./prd/kb-recall-test.md) | iter-09 |
| F-93 | Preferences RAG settings | [prd/rag-preferences.md](./prd/rag-preferences.md) | iter-09 |
| F-94 | Assistant multi-KB binding | [prd/assistant-kb-binding.md](./prd/assistant-kb-binding.md) | iter-09 |
| F-95 | Chat RAG workflow nodes | [prd/chat-rag-nodes.md](./prd/chat-rag-nodes.md) | iter-09 |

---

## 3. Document map

See Chinese overview for full tables; sub-PRDs under `prd/`, changelog at [changelog/iter-09.md](./changelog/iter-09.md).

---

## 4. Acceptance criteria (index)

- [ ] **AC-90** — Create KB in Console (name + description + single source)  
- [ ] **AC-91** — Async ingest; status processing → ready  
- [ ] **AC-92** — Chunk size / overlap from env  
- [ ] **AC-93** — Recall test on ready KB  
- [ ] **AC-94** — Preferences: confidence / TopK / embedding model  
- [ ] **AC-95** — Assistants multi-KB binding  
- [ ] **AC-96** — Query optimization step expandable  
- [ ] **AC-97** — RAG retrieval step shows hit details  
- [ ] **AC-98** — Retrieved chunks injected into LLM  
- [ ] **AC-99** — RLS; bound KB delete → 409  
- [ ] **AC-100** — No-KB assistant workflow unchanged  

See [changelog/iter-09.md](./changelog/iter-09.md) §5.

---

## 5. Product decisions (iter-09 confirmed)

| Item | Decision |
|------|----------|
| Parsing | PDF/DOCX → npm [`doc-to-md-rag`](https://www.npmjs.com/package/doc-to-md-rag) v1.x |
| Chunking | Structure boundaries (A) + token window + env overlap (B) |
| Ingestion | Async job; API returns processing immediately |
| Embedding | Locked at KB create; Preferences model change warns re-embed |
| Source | 1 KB = 1 source; no text+file mix |
| Delete | Bound to assistant → 409; ingest fail → error + Retry |

---

## 6. Revision history

| Date | Version | Change |
|------|------|--------|
| 2026-06-30 | v0.1 | iter-09 initial — PRD confirmed |

---

*Next: `02-technical-design.md` (fullstack-developer Phase A)*
