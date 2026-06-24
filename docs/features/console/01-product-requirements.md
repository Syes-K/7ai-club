# Console — Product Requirements (Index)

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **Project:** 7ai-club  
> **Feature slug:** `console`  
> **Iteration:** `iter-03` (delivered) · **`iter-05` (in progress)** — see [iter-05 README](../../iterations/iter-05/README.md)  
> **Roadmap phase:** 1 — MVP chat + configuration UI  
> **Status:** iter-03 delivered · **iter-05 PRD confirmed**  
> **PRD confirmed date:** 2026-06-16 (iter-03) · 2026-06-17 (iter-05)  
> **Document version:** v0.2

---

## 1. Executive Summary

Signed-in users get a **Console** with left sidebar navigation. iter-03 delivered **Profile**, **Assistants**, **New Chat assistant picker**, and placeholder pages. **iter-05** ships **Models** (BYOK + test), refactors **Profile** (Account / Preferences dual cards); Knowledge Base / MCP remain placeholders. Visual style matches landing **C2 · Electric Ocean**. **User-facing UI: English.**

Details live in topic PRDs — see [§3 Document map](#3-document-map).

---

## 2. Global Conventions

### 2.1 Routes

| Path | Page | Auth |
|------|------|------|
| `/console` | Redirect → `/console/profile` | Required |
| `/console/profile` | Profile | Required |
| `/console/models` | Model management (iter-05) | Required |
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
| LLM API keys | Server only; user keys encrypted in DB (iter-05) |
| CRUD own model configs | Owner (iter-05) |

### 2.4 Model Resolution (chat)

**iter-05:** Profile Preferences → **Passed** user model config (provider + model + key) → platform default Bailian `qwen3.6-plus` (env `BAILIAN_API_KEY`). Per-assistant model column **not** user-editable.

**iter-03 (superseded):** `preferred_model` string + env `LLM_PROVIDER` static list.

### 2.5 Out of Scope (feature-wide)

Knowledge Base upload/RAG, MCP connections, Anthropic/Azure/custom OpenAI-compat providers, per-assistant model picker, OAuth, org/multi-tenant, assistant KB/MCP mounting.

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
| F-24 | Model management | [prd/models.md](./prd/models.md) | iter-05 |

---

## 3. Document Map

| Doc | Scope |
|-----|-------|
| [prd/profile.md](./prd/profile.md) | Account, Preferences (iter-05 revision) |
| [prd/models.md](./prd/models.md) | BYOK, test, platform default |
| [prd/assistants.md](./prd/assistants.md) | Multi-assistant CRUD |
| [prd/chat-assistant-picker.md](./prd/chat-assistant-picker.md) | New Chat flow |
| [prd/placeholders.md](./prd/placeholders.md) | KB, MCP stubs (Models moved to F-24) |
| [changelog/iter-03.md](./changelog/iter-03.md) | iter-03 delta, AC-01–12 |
| [changelog/iter-05.md](./changelog/iter-05.md) | iter-05 delta, AC-40–48 |

Technical index: [02-technical-design.md](./02-technical-design.md)

---

## 4. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-06-16 | v0.1 | Initial PRD — iter-03 |
| 2026-06-17 | v0.2 | iter-05 — F-24 Models, Profile Preferences refactor |

---

*Overview: [README.md](./README.md)* · *Iteration: [iter-05](../../iterations/iter-05/README.md)*
