# Knowledge base — Ingestion pipeline

> **English:** [kb-ingestion.md](./kb-ingestion.md)  
> **中文:** [kb-ingestion-cn.md](./kb-ingestion-cn.md)  
> **Iteration:** iter-09

See [kb-ingestion-cn.md](./kb-ingestion-cn.md): `lib/rag/`, `doc-to-md-rag`, hybrid chunking, async via `after()` (**§8 detailed**), retry route `maxDuration=300`. Default embed: SiliconFlow `BAAI/bge-m3` 1024d.

**File storage:** persistent files in Supabase Storage + Postgres; PDF/DOCX parse uses ephemeral `/tmp` via `os.tmpdir()` — see **§8.8** (Vercel constraints).
