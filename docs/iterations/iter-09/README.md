# iter-09 — Knowledge Base RAG

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Iteration ID:** `iter-09`  
> **Status:** **Published**  
> **Roadmap phase:** 2 — Knowledge base  
> **Planned release:** 2026-07-01  
> **Actual release:** 2026-07-01  
> **Git tag (optional):** `iter-09`

---

## 1. Goals

- [x] Console KB CRUD, single-source upload/paste, async ingestion (parse → chunk → embed)
- [x] Preferences recall settings; Assistants multi-KB binding
- [x] Chat workflow: `rag_query_optimize` + `rag_retrieve` nodes and recall test
- [x] Supabase pgvector + RLS; iter-06–08 regression pass

---

## 2. Scope

See [README-cn.md](./README-cn.md) §2.

---

## 3. Features

| Slug | Changelog | Status |
|------|-----------|--------|
| `knowledge-base` | [changelog/iter-09.md](../../features/knowledge-base/changelog/iter-09.md) | **Published** |
| `console` (delta) | See changelog §1 · [models §3.10](../../features/console/prd/models.md) | **Published** |
| `agent-orchestration` (delta) | See changelog §1 | **Published** |

**Required PRD:** [knowledge-base README.md](../../features/knowledge-base/README.md)

---

## 4. Acceptance

### 4.1 Automation

- [x] `pnpm lint` — 2026-07-01
- [x] `pnpm build` — 2026-07-01
- [x] `pnpm test` — 122 passed
- [x] `pnpm test:e2e` — `CI=1`; 25 passed, 3 skipped

### 4.2 Manual QA

- [x] AC-90–100 — [changelog §5 / §12](../../features/knowledge-base/changelog/iter-09.md) (M-01 PDF skipped)

### 4.3 Release

- [x] All changelog §5 AC checked (qa-engineer · 2026-07-01)
- [x] Iteration closed (2026-07-01)

### 4.4 Post-release polish (§10)

See [changelog §10](../../features/knowledge-base/changelog/iter-09-cn.md).

---

## 5. Dependencies & risks

See [README-cn.md](./README-cn.md) §5.

---

## 6. Gate log

| Date | Event |
|------|-------|
| 2026-06-30 | PRD confirmed |
| 2026-06-30 | Technical design confirmed |
| 2026-06-30 | Phase B coding delivered |
| 2026-07-01 | QA C0–C4 complete |
| 2026-07-01 | Post-release polish §10 |
| 2026-07-01 | **Published** |

---

## 7. Revision history

| Date | Change |
|------|--------|
| 2026-06-30 | Created iter-09 |
| 2026-07-01 | QA passed; §10 polish; marked **Published** |
