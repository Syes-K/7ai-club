# knowledge-base — Feature overview

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Feature slug:** `knowledge-base`  
> **Iteration:** [`iter-09`](../../iterations/iter-09/README.md) (**Published · 2026-07-01**)  
> **Roadmap phase:** 2 — Knowledge base

---

## Document map (Agent entry)

**iter-09 published — start with changelog:**

1. [01-product-requirements.md](./01-product-requirements.md) — overview §2 global conventions  
2. [changelog/iter-09.md](./changelog/iter-09.md) — **iter-09 AC-90–100**  
3. Sub-PRDs (load on demand):
   - [kb-management.md](./prd/kb-management.md)
   - [kb-ingestion.md](./prd/kb-ingestion.md)
   - [kb-recall-test.md](./prd/kb-recall-test.md)
   - [rag-preferences.md](./prd/rag-preferences.md) (revises console/profile)
   - [assistant-kb-binding.md](./prd/assistant-kb-binding.md) (revises console/assistants)
   - [chat-rag-nodes.md](./prd/chat-rag-nodes.md) (revises agent-orchestration)

| Layer | Overview | Sub-docs |
|-------|----------|----------|
| Product | [01-product-requirements.md](./01-product-requirements.md) | [prd/](./prd/) |
| Technical | [02-technical-design.md](./02-technical-design.md) | [design/](./design/) (Phase A) |

**Related features:** [console](../console/README.md) · [agent-orchestration](../agent-orchestration/README.md)

---

## iter-09 scope summary

- **Console** — `/console/knowledge` list CRUD; single source (text **or** file); name + description  
- **Ingestion** — async job after upload: `doc-to-md-rag` (pdf/docx) → hybrid chunking (structure + token window + env overlap) → embed → pgvector  
- **Recall test** — ready KBs accept test queries  
- **Preferences** — confidence (default **0.65**), TopK (default **3**), embedding model (Platform default + Passed embedding; **locked at KB create**)  
- **Assistants** — multi-select KB binding  
- **Chat** — when KB bound: `rag_query_optimize` → `rag_retrieve` workflow nodes  

---

*Layering:* [docs/README.md](../../README.md)
