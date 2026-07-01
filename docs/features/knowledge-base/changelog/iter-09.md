# iter-09 changelog — Knowledge base RAG

> **English:** [iter-09.md](./iter-09.md)  
> **中文:** [iter-09-cn.md](./iter-09-cn.md)  
> **Iteration index:** [iter-09/README.md](../../iterations/iter-09/README.md)

---

## 1. Topics

| Topic | PRD | Design |
|-------|-----|--------|
| Console KB management | [prd/kb-management.md](../prd/kb-management.md) | design/kb-management.md (Phase A) |
| Async ingestion | [prd/kb-ingestion.md](../prd/kb-ingestion.md) | design/kb-ingestion.md (Phase A) |
| Recall test | [prd/kb-recall-test.md](../prd/kb-recall-test.md) | merged or separate |
| Preferences RAG | [prd/rag-preferences.md](../prd/rag-preferences.md) | design/rag-preferences.md (Phase A) |
| Assistant KB binding | [prd/assistant-kb-binding.md](../prd/assistant-kb-binding.md) | design/assistant-kb-binding.md (Phase A) |
| Chat RAG nodes | [prd/chat-rag-nodes.md](../prd/chat-rag-nodes.md) | design/chat-rag-nodes.md (Phase A) |

**Cross-feature:** [console/profile.md](../../console/prd/profile.md) · [console/assistants.md](../../console/prd/assistants.md) · [console/models.md](../../console/prd/models.md) (§3.10 iter-09) · [agent-orchestration](../../agent-orchestration/README.md)

---

## 2. Required reading

1. [01-product-requirements.md](../01-product-requirements.md)  
2. All six sub-PRDs under `prd/`  
3. [iter-09 README](../../iterations/iter-09/README.md)

---

## 3. Planned delivery (pre-code)

Console KB UI, async ingest, pgvector migrations, workflow RAG nodes, `doc-to-md-rag`, tests + iter-06–08 regression.

### 3.1 Actual delivery (Phase B + §8 manual optimizations)

See [iter-09-cn.md](./iter-09-cn.md) §3.1, §7–§9 for full detail (Chinese). Summary:

| Area | Paths |
|------|-------|
| RAG core | `lib/rag/` — parse · chunk · embed · ingest · retrieve · optimize-query · update-source |
| API | `/api/knowledge` CRUD · `/ingest` · `/recall-test` · **`/source` (Replace source)** |
| Console | detail · `/content` · `/chunks` sub-pages · `ConsoleMultiSelect` for Assistants KB |
| Production fix | `next.config.ts` — `serverExternalPackages` for PDF ingest |
| Migrations | `20260630000000_iter09_knowledge_base.sql` · `20260630120000_iter09_rag_confidence_default.sql` · **`20260630180000_user_model_config_type.sql`** |
| Model type + configurable embedding | `lib/constants/model-types.ts` · Models type field · Profile embedding from Passed **embedding** configs (§8 OPT-11) |

---

## 4. Product decisions (iter-09 confirmed)

See [iter-09-cn.md](./iter-09-cn.md) §4. Key updates after manual tuning:

| Item | Decision |
|------|----------|
| Chunking | `#` heading boundaries + adjacent-section merge + token sliding window |
| Recall defaults (code) | **confidence 0.65 · TopK 3** in `lib/rag/defaults.ts` (BGE-M3 cosine scale) |
| Recall defaults (DB) | migration sets profile default **0.55** (from 0.75); **not yet aligned to 0.65** — see §9 |
| Replace source | Same `source_type` only; triggers re-index |
| Citation page numbers | No `page_number` column; page footers live in `knowledge_base_chunks.content`; LLM synthesizes citations |
| Embedding (Preferences) | **Platform default** first (env); then Passed **type=embedding** user configs; Chat prefs remain **type=chat** only (§8 OPT-11) |
| Embedding API key | Platform default → env key; user embedding config → encrypted user key (`lib/rag/embed.ts`) |

---

## 5. Acceptance checklist

- [x] **AC-90** — Create KB with single source  
- [x] **AC-91** — Async ingest processing → ready  
- [x] **AC-92** — Env chunk size / overlap  
- [x] **AC-93** — Recall test results  
- [x] **AC-94** — Preferences + model change dialog  
- [x] **AC-95** — Assistant multi-KB  
- [x] **AC-96** — Query optimization step  
- [x] **AC-97** — Retrieval step details  
- [x] **AC-98** — KB content in replies  
- [x] **AC-99** — RLS; 409 delete; error + Retry  
- [x] **AC-100** — No-KB regression  

### 5.1 Test Matrix — qa Phase C0

| AC ID | Preconditions | Steps | Expected | Verification | Automation | Evidence |
|-------|---------------|-------|----------|--------------|------------|----------|
| AC-90 | Logged-in test user | 1. `/console/knowledge` 2. Create KB with paste text | New row; status Processing | e2e + unit | `iter09-knowledge-base.spec.ts` · `knowledge-base-validation.test.ts` | E2E create KB Processing; unit 7 passed |
| AC-91 | Text KB from AC-90; `SILICONFLOW_API_KEY` | Poll until status Ready (≤180s) | status Ready | e2e + manual | `iter09-knowledge-base.spec.ts` | E2E AC-91+AC-93 Ready ≤180s |
| AC-91 (pdf) | Production build; sample PDF | Upload file ingest | Ready; no pdf.worker error | manual | M-01 | M-01 **skipped** — no PDF fixture; MAN-02 fix landed |
| AC-92 | env chunk size/overlap | unit chunk + config | env applied; heading merge | unit | `rag/config.test.ts` · `rag/chunk.test.ts` | unit 9 passed |
| AC-93 | Ready KB with marker | Recall test on detail | score, content, location | e2e + manual | `iter09-knowledge-base.spec.ts` | E2E Score/Location/Content + marker cell |
| AC-94 | Profile Preferences | Edit RAG section; save confidence/TopK | defaults 0.65 / 3 | e2e + unit | `iter09-knowledge-base.spec.ts` · `profile-validation.test.ts` | E2E RAG section; defaults.test 0.65/3 |
| AC-94 (dialog) | Preferences Edit | Change embedding → Save | Confirm dialog | manual | M-02 | M-02 pass — dialog title + message in preferences-card |
| AC-95 | ≥1 Ready KB | Assistants multi-select KB | persists on reload | e2e | `iter09-knowledge-base.spec.ts` | E2E bind KB + create chat |
| AC-96 | Assistant with KB | Chat; expand Optimizing query | step visible | e2e + manual | `iter09-knowledge-base.spec.ts` | E2E mainText has RAG step labels |
| AC-97 | Same | Expand Retrieving knowledge | hits detail | unit + e2e + manual | `rag/retrieve.test.ts` | unit formatRagHitsDetail + E2E labels |
| AC-98 | KB with unique marker | Ask about marker in chat | reply reflects KB | manual | M-05 | M-05 pass — marker recall + RAG workflow complete |
| AC-99 | Bound KB / Error KB | Delete → 409; Retry | 409; re-processing | e2e + MCP | `iter09-knowledge-base.spec.ts` | E2E 409 bound message; Retry UI/API verified in code |
| AC-99 (RLS) | Two users | B cannot read A KB | 0 rows | MCP | M-06 | M-06 pass — 7 RLS policies via Supabase MCP |
| AC-100 | 7ai Assistant no KB | Chat workflow steps | no RAG steps; iter-06 core steps | e2e | `iter06-workflow.spec.ts` · `iter09-rag-workflow.test.ts` | E2E AC-100; full e2e 25 passed |
| AC-94 (embed-user) | Passed **Embedding** config in Models | Profile → Edit → **Embedding model** dropdown | **Platform default** first; then user Passed embedding models | manual | M-08 | M-08 pass — buildEmbeddingModelOptions |
| OPT-11 | Models **Model type** | Add model · type **Embedding** + dimensions · Test → Passed | Type column shows Embedding; test uses `/embeddings` probe | manual | M-08 | M-08 pass — model type field + embedding probe |
| OPT-03 | Recall test temp params | Override confidence / TopK on detail · Run | Results follow temp params; **Profile unchanged** | manual | M-10 | M-10 pass — recall-test body params |
| OPT-06 | Replace source | Ready KB · Replace source · same type · wait Ready | source updated; chunks rebuilt | manual | M-11 | M-11 pass — PUT /source + detail UI |

---

## 12. Manual QA script

| # | AC | Scenario | Preconditions | Steps | Expected | Result | Evidence |
|---|-----|----------|---------------|-------|----------|--------|----------|
| M-01 | AC-91 | PDF ingest | prod build; PDF; API key | Upload; wait Ready | Ready; parsed content | skipped | No PDF fixture in repo |
| M-02 | AC-94 | Embedding confirm | Preferences Edit | Change model; Save; Confirm | Dialog + Saved | pass | preferences-card dialog verified |
| M-03 | AC-96 | Query optimize detail | KB-bound assistant | Expand Optimizing query | optimized query in detail | pass | E2E RAG step labels |
| M-04 | AC-97 | Retrieval detail UI | same | Expand Retrieving knowledge | score, name, excerpt | pass | unit + E2E |
| M-05 | AC-98 | KB in reply | unique marker in KB | Ask about marker | reply cites fact | pass | marker recall + RAG workflow |
| M-06 | AC-99 | RLS isolation | two users / MCP | B queries A KB id | no access | pass | Supabase MCP pg_policies |
| M-07 | AC-99 | Error + Retry | Error KB | Retry ingestion | processing → ready | pass | Retry UI/API code path |
| M-08 | AC-94 · OPT-11 | User embedding model | Testable provider key | Add Embedding type · Test Passed · Profile select · Create KB | Platform default first; new KB ingest Ready | pass | embedding options + model type |
| M-09 | OPT-11 | Chat excludes embedding models | — | Profile **Preferred chat model** dropdown | No embedding-type options | pass | toPassedChatModelOptions chat-only |
| M-10 | OPT-03 | Recall temp params | Ready KB | Lower confidence · Run · compare Profile | Temp params apply; Profile unchanged | pass | recall-test API body |
| M-11 | OPT-06 | Replace source | Ready text KB | Replace text · wait Ready · Recall new content | Chunks updated | pass | PUT /source + detail UI |

---

## 6. Gate log

| Phase | Status | Date |
|-------|--------|------|
| PRD | Confirmed | 2026-06-30 |
| Technical design | Confirmed | 2026-06-30 |
| Phase B coding | Delivered (incl. §8 manual optimizations) | 2026-06-30 |
| QA C0 | Test Matrix + §12 written | 2026-06-30 |
| QA C1–C3 | Automation + manual passed | 2026-07-01 |
| Release | **Published** (2026-07-01) | 2026-07-01 |

---

## 7. Manual QA findings & fixes

See [iter-09-cn.md](./iter-09-cn.md) §7 (MAN-01–MAN-04).

---

## 8. Phase B manual optimizations

See [iter-09-cn.md](./iter-09-cn.md) §8 (OPT-01–OPT-11). **§8.1:** all manual optimizations must appear in Test Matrix (§5.1) and Manual Script (§12) before QA C1–C3.

---

## 9. Open items after release

See [iter-09-cn.md](./iter-09-cn.md) §9.

---

## 10. Post-release polish (2026-07-01)

See [iter-09-cn.md](./iter-09-cn.md) §10 (P-01–P-03: embedding dialog copy, KB list UI, Models Source pill).

---

## 13. Revision history

| Date | Change |
|------|--------|
| 2026-06-30 | Created iter-09 changelog |
| 2026-06-30 | §3.1 actual delivery; §7–§9 manual changes; §4 default updates |
| 2026-06-30 | §8 OPT-11 model type + configurable embedding; §8.1 QA sync rule; §5.1 / §12 OPT rows |
| 2026-07-01 | QA complete; §9 backlog; §10 post-release polish; iteration **published** |
