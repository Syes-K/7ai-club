# Profile

> **English:** [profile.md](./profile.md)  
> **中文：** [profile-cn.md](./profile-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-03

---

## 1. Scope

F-21 — `/console/profile`: read-only email, editable nickName, preferred chat model.

---

## 2. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-20 | As a signed-in user, I want to set a nickName so that I am shown by name across the app | P0 |
| US-21 | As a signed-in user, I want to pick my preferred chat model so that new chats use it | P0 |

---

## 3. F-21 Profile

### 3.1 Fields

| Field | Editable | Source |
|-------|----------|--------|
| Email | No | Supabase Auth |
| Nickname | Yes | `user_profiles.nickname` |
| Preferred model | Yes | `user_profiles.preferred_model` |

### 3.2 Nickname display

When nickname is set, show it in **site header** and **chat** (fallback to email local-part / full email when empty).

Initials avatar: still derived from email (unchanged).

### 3.3 Model picker

- Dropdown of **curated models** for the active `LLM_PROVIDER` (3–5 ids, code constant)
- Save persists to profile; applies to **new** chat LLM calls
- Label shows model id + provider name (English)

### 3.4 UX

- Single **Save** button or per-section save
- Success toast or inline “Saved”
- Validation: nickname max 32 chars; trim whitespace; empty → clear nickname

---

## 4. Acceptance Criteria

- [ ] **AC-04** — Email read-only; nickName saves and shows in header/chat
- [ ] **AC-05** — Model preference saves; new conversations use updated model

---

## 5. Revision History

| Date | Change |
|------|--------|
| 2026-06-16 | Initial |
