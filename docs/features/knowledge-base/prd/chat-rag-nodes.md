# Chat — RAG workflow nodes

> **English:** [chat-rag-nodes.md](./chat-rag-nodes.md)  
> **中文:** [chat-rag-nodes-cn.md](./chat-rag-nodes-cn.md)  
> **Overview:** [01-product-requirements.md](../01-product-requirements.md)  
> **Revises:** [agent-orchestration](../../agent-orchestration/README.md)  
> **Iteration:** iter-09

---

## 1. Scope

F-95 — When assistant has ≥1 bound KB, insert before LLM generation:

1. **`rag_query_optimize`** — LLM rewrite for retrieval  
2. **`rag_retrieve`** — vector search  

Uses iter-08 Workflow Registry and step UI.

---

## 2. User stories

| ID | Story | Priority |
|----|-------|----------|
| US-101 | As a user, I want to see how my query was optimized for retrieval | P0 |
| US-102 | As a user, I want retrieval hits with scores and sources | P0 |

---

## 3. F-95 Nodes

### 3.1 Condition

≥1 ready KB bound → run both nodes after `resolve_model`, before `reasoning` / `llm_stream`. No KB → iter-08 unchanged.

### 3.2 `rag_query_optimize`

Label: *Optimizing query for retrieval*. Chat LLM rewrites user input for vector search only. Expandable **Optimized query** in step detail. Fallback to raw text on error (tech design).

### 3.3 `rag_retrieve`

Label: *Retrieving knowledge*. Vector search across bound KBs; apply Preferences confidence & TopK. Detail: score, KB name, content, location. Inject chunks into LLM context on success.

### 3.4 Three-state UI

Live SSE, refresh restore, history from DB — same as iter-08.

### 3.5 Catalog (draft order)

`rag_query_optimize` @ 42, `rag_retrieve` @ 43 (between `resolve_model` 40 and `reasoning` 45).

---

## 4. Acceptance criteria

- [ ] **AC-96** — Expandable optimized query  
- [ ] **AC-97** — Retrieval detail with score, content, location  
- [ ] **AC-98** — Reply reflects KB content  
- [ ] **AC-100** — No-KB assistant unchanged  

---

## 5. Revision history

| Date | Change |
|------|--------|
| 2026-06-30 | iter-09 initial — revises agent-orchestration |
