# Recall test

> **English:** [kb-recall-test.md](./kb-recall-test.md)  
> **中文:** [kb-recall-test-cn.md](./kb-recall-test-cn.md)  
> **Overview:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-09

---

## 1. Scope

F-92 — **Recall test** on KB detail: test query against `ready` KBs; show vector hits.

---

## 2. User stories

| ID | Story | Priority |
|----|-------|----------|
| US-96 | As a user, I want to test recall before using KB in Chat | P0 |

---

## 3. F-92 Recall test

### 3.1 Entry

**Recall test** section on KB detail. Enabled only when `ready`.

### 3.2 UI

Query input + **Run recall test**. Results sorted by score desc; max **TopK** from Preferences (default 5).

### 3.3 Result row

**Score**, **Content** (expandable), **Location** (heading path or line range). Hits below confidence threshold (default 0.75) hidden. Empty: *No results above the confidence threshold.*

### 3.4 Parameters

TopK & threshold from Preferences. Embedding model from **KB-locked** model at create.

### 3.5 Consistency

Same retrieval lib as Chat `rag_retrieve` node.

---

## 4. Acceptance criteria

- [ ] **AC-93** — Recall test shows score, content, location  
- [ ] **AC-94** — Preferences TopK / confidence affect test  

---

## 5. Revision history

| Date | Change |
|------|--------|
| 2026-06-30 | iter-09 initial |
