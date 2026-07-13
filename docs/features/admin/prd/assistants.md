# Platform Assistants

> **English:** [assistants.md](./assistants.md)  
> **中文:** [assistants-cn.md](./assistants-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-12

---

## 1. Scope

F-33 — `/admin/assistants`: admins CRUD **system assistants** (`is_platform = true`); all users pick them in New Chat **aggregated list** (after personal assistants).

F-34 — **New Chat picker**: **single aggregated list** (personal first, system last); **remove** auto seed copy.

Platform assistant fields match Console private assistants: **no** per-assistant model (Profile preference for chat).

---

## 2. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-48 | As an admin, I configure system assistants for all users | P0 |
| US-49 | As a user, I pick a system assistant in New Chat | P0 |
| US-50 | As a user, I can tell personal vs system assistants apart | P0 |
| US-51 | As a user with zero personal assistants, I can still chat via system assistants in the list | P0 |

---

## 3. F-33 Platform Assistants Page

### 3.1 Route & layout

- Route: `/admin/assistants`
- Page title (English): **Platform assistants**
- UI mirrors `/console/assistants` (`AssistantsManager` pattern)

### 3.2 Data model (product layer)

| Field | Notes |
|-------|-------|
| `is_platform` | `true` — system assistant; admin write only |
| `user_id` | `NULL` (platform-level) |
| `is_default` | After removing auto seed, platform assistants **do not** use `is_default` for copy; column may remain but iter-12 does not depend on it |

### 3.3 List

Table: **Icon**, **Name**, **Opening message** (truncated), **Enabled**, last updated, Actions.

**Empty state:** *"No platform assistants yet. Create one for all users."* + **Create assistant**

### 3.4 Create / Edit

Aligned with Console Assistants fields:

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | English; max 64 chars |
| Icon | No | emoji, max 16 chars |
| Opening message | No | max 2000 chars |
| System prompt | Yes | multiline |
| Enabled | Yes | default `true`; `false` hides from user picker |

**Out of scope this iteration:** Knowledge bases multi-select, MCP, per-assistant model.

### 3.5 Delete

- Confirmation dialog
- If `conversations.assistant_id` references this platform assistant → **block delete** (409)
- English: *"This assistant is used in N chat(s). Disable it instead."*
- Prefer **Disable** over hard delete

### 3.6 Permissions

| Action | Admin | Regular user |
|--------|-------|--------------|
| Admin CRUD | Yes | No |
| View enabled system assistants | — | New Chat aggregated list (after personal) |
| Edit / delete system assistants | — | No |
| Create conversation with system assistant | — | Yes |

---

## 4. F-34 New Chat Picker Redesign

### 4.1 Aggregated list (no tabs)

Single modal list:

| Order | Content |
|-------|---------|
| **First** | Personal (`user_id = auth.uid()`) |
| **Last** | System (`is_platform = true`, enabled) |

System rows show **Platform** badge. No tabs.

### 4.2 Create flow

Select one row → Create → `assistantId` in `POST /api/conversations`. Model from Profile preference.

### 4.3 Remove auto seed

| Old behavior | New behavior |
|--------------|--------------|
| Zero personal assistants → RPC copies from template | **No copy** |
| Platform template `user_id IS NULL` + `is_default` | Migrated to `is_platform = true`; Admin manages |
| No personal assistants | List shows enabled system assistants at bottom; optional hint to create personal |
| User wants chat with zero personal | Select system assistant in same list (no tab switch) |

### 4.4 Existing conversations

Unchanged: history still bound to original `assistant_id` (incl. deleted/disabled platform assistants — read-only display per technical design).

### 4.5 Console Assistants page

Personal assistants only; system assistants not shown. [console/prd/assistants.md](../../console/prd/assistants.md) §3.4 auto seed **superseded** by this §4.3.

---

## 5. Acceptance Criteria

- [ ] **AC-134** — Admin CRUD platform assistants
- [ ] **AC-135** — Single aggregated list; personal before system
- [ ] **AC-136** — Select enabled system assistant to create conversation
- [ ] **AC-137** — Auto seed copy removed
- [ ] **AC-138** — List order: personal entries first, system entries last
- [ ] **AC-139** — Chat uses Profile model preference
- [ ] **AC-140** — Disabled platform assistants not in list
- [ ] **AC-141** — Non-admin blocked from admin assistants API

---

## 6. Revision History

| Date | Change |
|------|--------|
| 2026-07-12 | Initial; is_platform, no seed |
| 2026-07-12 | F-34 aggregated list (no dual tabs) |
