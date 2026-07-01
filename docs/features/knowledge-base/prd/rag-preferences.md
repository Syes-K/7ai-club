# Preferences — RAG retrieval settings

> **English:** [rag-preferences.md](./rag-preferences.md)  
> **中文:** [rag-preferences-cn.md](./rag-preferences-cn.md)  
> **Overview:** [01-product-requirements.md](../01-product-requirements.md)  
> **Revises:** [console/prd/profile.md](../../console/prd/profile.md)  
> **Iteration:** iter-09

---

## 1. Scope

F-93 — Add **RAG / Knowledge retrieval** block to Profile Preferences (English UI); independent Save.

---

## 2. User stories

| ID | Story | Priority |
|----|-------|----------|
| US-97 | As a user, I want confidence and TopK settings for RAG quality | P0 |
| US-98 | As a user, I want to pick an embedding model for new KBs | P0 |

---

## 3. F-93 RAG Preferences

### 3.1 Fields

| Field | Default | Validation |
|-------|---------|------------|
| Confidence threshold | **0.65** (`lib/rag/defaults.ts`) | 0 < x ≤ 1 |
| Top K | **3** | 1 ≤ x ≤ 50 |
| Embedding model | env platform default (**Platform default**, first in list) | **Platform default** + user **Passed · type=embedding** configs ([models §3.10](../../console/prd/models.md)) |

### 3.2 Model change warning

On Save when embedding model changed: confirm dialog (English) explaining existing KBs keep locked model; create a new KB for new model—Retry ingestion does not switch embedding. Confirm to persist.

### 3.3 Scope

Confidence / TopK → recall test + Chat retrieve. Embedding model → **new KBs only**.

---

## 4. Acceptance criteria

- [ ] **AC-94** — Edit, Save, View; defaults correct; model change dialog  

---

## 5. Revision history

| Date | Change |
|------|--------|
| 2026-06-30 | iter-09 initial — revises console/profile |
| 2026-06-30 | Defaults 0.65 / TopK 3; embedding dropdown from Platform default + Passed embedding configs |
| 2026-07-01 | §3.2 confirm dialog: Retry ingestion does not switch KB embedding model |
