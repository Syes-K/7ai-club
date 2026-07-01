# Assistants — Knowledge base binding

> **English:** [assistant-kb-binding.md](./assistant-kb-binding.md)  
> **中文:** [assistant-kb-binding-cn.md](./assistant-kb-binding-cn.md)  
> **Overview:** [01-product-requirements.md](../01-product-requirements.md)  
> **Revises:** [console/prd/assistants.md](../../console/prd/assistants.md)  
> **Iteration:** iter-09

---

## 1. Scope

F-94 — Assistant create/edit form: bind **0–N** knowledge bases (multi-select).

---

## 2. User stories

| ID | Story | Priority |
|----|-------|----------|
| US-99 | As a user, I want multiple KBs on an assistant for broader retrieval | P0 |
| US-100 | As a user, I only want Ready KBs in the picker | P1 |

---

## 3. F-94 Binding

### 3.1 Form

**Knowledge bases** multi-select. Options: owner's KBs with `status = ready` only. Optional (0 KBs). Not shown on list table.

### 3.2 Persistence

`assistant_knowledge_bases` join table.

### 3.3 Chat

≥1 KB → RAG workflow nodes. 0 KB → iter-08 behavior unchanged.

### 3.4 Delete guard

Bound KB cannot be deleted (409).

---

## 4. Acceptance criteria

- [ ] **AC-95** — Multi-select ready KBs on assistant  
- [ ] **AC-99** — Bound KB delete → 409  
- [ ] **AC-100** — No RAG nodes without KB binding  

---

## 5. Revision history

| Date | Change |
|------|--------|
| 2026-06-30 | iter-09 initial — revises console/assistants |
