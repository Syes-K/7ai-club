# Knowledge base management (Console)

> **English:** [kb-management.md](./kb-management.md)  
> **中文:** [kb-management-cn.md](./kb-management-cn.md)  
> **Overview:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-09

---

## 1. Scope

F-90 — `/console/knowledge`: per-user KB list; create, edit, delete (with guards). Replaces iter-03 placeholder.

---

## 2. User stories

| ID | Story | Priority |
|----|-------|----------|
| US-90 | As a user, I want a KB list in Console to manage my materials | P0 |
| US-91 | As a user, I want to create a KB with name, description, and pasted content | P0 |
| US-92 | As a user, I want to upload md/txt/pdf/docx as the KB source | P0 |
| US-93 | As a user, I want ingest progress and error states so I know when to retry | P0 |

---

## 3. F-90 Knowledge Base management

### 3.1 List

Table: **Name**, **Description** (truncated), **Source type** (`Text` / `File`), **Status** (`Processing` / `Ready` / `Error`), updated at, Actions. Empty state with **Create knowledge base**. `Processing` rows show spinner or *Processing…*.

### 3.2 Create

**Source (pick one; immutable after create):**

| Mode | Input | Notes |
|------|-------|-------|
| **Text** | Multiline textarea | Markdown or plain text |
| **File** | File picker | `.md`, `.txt`, `.pdf`, `.docx`; single file |

**Fields:** Name (required, max 64), Description (optional, max 500).

After create: status `processing`; async ingest starts; **embedding model locked** from current Preferences.

### 3.3 Detail / edit

Name & Description editable. Source not replaceable. `Ready`: recall test link. `Error`: message + **Retry ingestion**. `Processing`: no recall test.

### 3.4 Delete

Confirm dialog. Bound to assistant → HTTP 409. English error e.g. *"This knowledge base is bound to N assistant(s). Unbind it first."*

### 3.5 Permissions

Owner-only via RLS.

---

## 4. Acceptance criteria

- [ ] **AC-90** — Create KB with single source  
- [ ] **AC-91** — Processing → Ready after ingest  
- [ ] **AC-99** — Bound delete → 409; error + Retry  

---

## 5. Revision history

| Date | Change |
|------|--------|
| 2026-06-30 | iter-09 initial |
