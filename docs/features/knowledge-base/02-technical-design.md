# Knowledge Base RAG — Technical design overview

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文:** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **Feature slug:** `knowledge-base` · **Iteration:** `iter-09` · **Status:** Draft · **v0.1**

See [02-technical-design-cn.md](./02-technical-design-cn.md) for full content. Module index:

| Module | Doc |
|--------|-----|
| Schema | [design/kb-schema.md](./design/kb-schema.md) |
| Ingestion | [design/kb-ingestion.md](./design/kb-ingestion.md) |
| Console | [design/kb-console.md](./design/kb-console.md) |
| Workflow RAG | [design/chat-rag-nodes.md](./design/chat-rag-nodes.md) |
| Console integration | [design/console-rag-integration.md](./design/console-rag-integration.md) |

Architecture: Supabase pgvector (1024 dims) + Storage; async ingest via Next.js `after()`; default embedding SiliconFlow `BAAI/bge-m3`.
