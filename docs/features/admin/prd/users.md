# User Management

> **English:** [users.md](./users.md)  
> **中文:** [users-cn.md](./users-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-12

---

## 1. Scope

F-31 — `/admin/users`: admins view all registered users; **disable accounts** and **trigger password reset**.

---

## 2. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-40 | As an admin, I want to see all users and their status | P0 |
| US-41 | As an admin, I want to disable abusive accounts | P0 |
| US-42 | As an admin, I want to send password reset emails | P0 |
| US-43 | As an admin, I want to re-enable disabled users | P1 |

---

## 3. F-31 Users Page

### 3.1 Route & Layout

- Route: `/admin/users`
- Page title (English): **User management**
- Main: searchable, paginated table

### 3.2 Columns

| Column (English) | Source |
|------------------|--------|
| Email | `auth.users.email` |
| Nickname | `user_profiles.nickname`; empty → `—` |
| Status | `Active` · `Disabled` · `Unconfirmed` |
| Registered | `created_at` |
| Last sign-in | `last_sign_in_at`; never → `Never` |
| Assistants | count where `user_id = uid` |
| Conversations | conversation count |
| Actions | §3.4 |

**Default sort:** registered desc.  
**Pagination:** 20 per page.

### 3.3 Search

- Search box (placeholder: *"Search by email or nickname"*)
- Match email or nickname; 300ms debounce
- Empty: *"No users match your search."*

### 3.4 Actions

| Action | When | Behavior |
|--------|------|----------|
| **Disable** | Active; not self | confirm → ban via admin API |
| **Enable** | Disabled | confirm → unban |
| **Send password reset** | Active user | confirm → Supabase reset email |
| **—** | Self | Disable disabled; tooltip *"You cannot disable your own account."* |

### 3.5 Disable Semantics

- Supabase Auth ban (design picks API)
- Disabled users cannot sign in; English error *"Your account has been disabled. Contact support."*
- Existing sessions invalidated on next refresh
- Data retained (soft ban)

### 3.6 Password Reset

- Admin triggers Supabase reset flow
- Success: *"Password reset email sent."*
- No plaintext password in admin UI

### 3.7 API (Product Layer)

All `/api/admin/users/*` with `requireAdmin()`:

| Capability | Notes |
|------------|-------|
| `GET` list | paginated + search; `service_role` |
| `POST` disable | `userId` |
| `POST` enable | `userId` |
| `POST` reset-password | `userId` or `email` |

### 3.8 Edge Cases

| Case | Expected |
|------|----------|
| Non-admin | 403 |
| Disable self | blocked |
| User not found | 404 |
| Load failure | error + Retry |

---

## 4. Acceptance Criteria

- [ ] **AC-120** — Paginated user list with §3.2 columns
- [ ] **AC-121** — Search by email / nickname
- [ ] **AC-122** — Disable blocks sign-in
- [ ] **AC-123** — Re-enable works
- [ ] **AC-124** — Password reset email sent
- [ ] **AC-125** — Cannot disable self
- [ ] **AC-126** — Non-admin blocked from page and API

---

## 5. Revision History

| Date | Change |
|------|--------|
| 2026-07-12 | Initial draft |
