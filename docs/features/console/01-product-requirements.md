# Console — Product Requirements (Index)

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `console`  
> **Iteration:** `iter-03` (see [iter-03 README](../../iterations/iter-03/README.md))  
> **Roadmap phase:** 1 — MVP chat + configuration UI  
> **Status:** Confirmed  
> **PRD confirmed date:** 2026-06-16  
> **Document version:** v0.1

---

## 1. Executive Summary

Signed-in users get a **Console** with left sidebar navigation and multiple pages. iter-03 delivers **Profile** (email, nickName, preferred chat model), **Assistants** (multi-assistant CRUD with system prompt), **New Chat assistant picker**, and placeholder pages for Models / Knowledge Base / MCP. Visual style matches landing **C2 · Electric Ocean**. **User-facing UI: English.**

Details live in topic PRDs — see [§3 Document map](#3-document-map).

---

## 2. Global Conventions

### 2.1 Routes

| Path | Page | Auth |
|------|------|------|
| `/console` | Redirect → `/console/profile` | Required |
| `/console/profile` | Profile | Required |
| `/console/models` | Model management (placeholder) | Required |
| `/console/assistants` | Assistants | Required |
| `/console/knowledge` | Knowledge Base (placeholder) | Required |
| `/console/mcp` | MCP (placeholder) | Required |

### 2.2 Navigation

- **Entry:** Site header **Console** link + UserMenu item (signed-in only)
- **Console shell:** Left sidebar — Profile → Models → Assistants → Knowledge Base → MCP
- **Cross-link:** Console header keeps **Chat** link

### 2.3 Permissions

| Action | Who |
|--------|-----|
| View `/console/*` | Signed-in users |
| Edit own profile | Owner |
| CRUD own assistants | Owner |
| Delete assistant with bound conversations | Blocked |
| Platform template assistants (`user_id` null) | Not visible in UI; server seed only |
| LLM API keys | Server only |

### 2.4 Model Resolution (chat)

Priority: **user `preferred_model`** (Profile) → env `LLM_MODEL` → active provider default. Per-assistant `model` column is **not** user-editable in iter-03.

### 2.5 Out of Scope (feature-wide)

Knowledge Base upload/RAG, MCP connections, Model provider admin, per-assistant model picker, OAuth, org/multi-tenant, assistant KB/MCP mounting.

### 2.6 Non-Functional (summary)

- Rendering: Console pages may use client components (CSR-friendly)
- Security: RLS on `user_profiles` and per-user `assistants`; API `getUser()` gate
- Locale: user-visible UI **English**

### 2.7 Feature Index

| ID | Topic | PRD | Iteration |
|----|-------|-----|-----------|
| F-20 | Console shell & placeholders | [prd/placeholders.md](./prd/placeholders.md) | iter-03 |
| F-21 | Profile | [prd/profile.md](./prd/profile.md) | iter-03 |
| F-22 | Assistants CRUD | [prd/assistants.md](./prd/assistants.md) | iter-03 |
| F-23 | New Chat assistant picker | [prd/chat-assistant-picker.md](./prd/chat-assistant-picker.md) | iter-03 |

---

## 3. Document Map

| Doc | Scope |
|-----|-------|
| [prd/profile.md](./prd/profile.md) | nickName, preferred model |
| [prd/assistants.md](./prd/assistants.md) | Multi-assistant CRUD |
| [prd/chat-assistant-picker.md](./prd/chat-assistant-picker.md) | New Chat flow |
| [prd/placeholders.md](./prd/placeholders.md) | Models, KB, MCP stubs |
| [changelog/iter-03.md](./changelog/iter-03.md) | iter-03 delta, AC-01–12 |

Technical index: [02-technical-design.md](./02-technical-design.md)

---

## 4. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-06-16 | v0.1 | Initial PRD — iter-03 |

---

*Overview: [README.md](./README.md)* · *Iteration: [iter-03](../../iterations/iter-03/README.md)*
