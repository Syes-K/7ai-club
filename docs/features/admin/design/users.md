# User Management — Technical Design

> **English:** [users.md](./users.md)  
> **中文:** [users-cn.md](./users-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [prd/users.md](../prd/users.md)  
> **Iteration:** iter-12

---

## 1. API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/users` | Paginated list + search |
| POST | `/api/admin/users/[id]/disable` | Ban user |
| POST | `/api/admin/users/[id]/enable` | Remove ban |
| POST | `/api/admin/users/[id]/reset-password` | Send reset email |

**Query (GET):**

| Param | Default | Notes |
|-------|---------|-------|
| `page` | 1 | Page number |
| `perPage` | 20 | Page size |
| `q` | — | Fuzzy search on email / nickname |

---

## 2. Implementation

Use `createServiceClient().auth.admin`:

```typescript
// List (paginated)
const { data, error } = await service.auth.admin.listUsers({
  page,
  perPage,
});
```

**Join `user_profiles`:** batch `user_id IN (...)` for nickname.

**Counts:**

```sql
SELECT user_id, COUNT(*) FROM assistants WHERE user_id IS NOT NULL GROUP BY user_id;
SELECT user_id, COUNT(*) FROM conversations GROUP BY user_id;
```

Or parallel per-user counts in API for current page (MVP: acceptable N+1 for ~20 rows).

**Status derivation:**

| Condition | Status |
|-----------|--------|
| Active `ban_duration` | `Disabled` |
| `email_confirmed_at` empty | `Unconfirmed` |
| Otherwise | `Active` |

---

## 3. Disable / Enable

```typescript
await service.auth.admin.updateUserById(userId, {
  ban_duration: "876000h", // ~100y soft ban
});

await service.auth.admin.updateUserById(userId, {
  ban_duration: "none",
});
```

**Self-disable:** `if (userId === admin.id) return 400`.

---

## 4. Password reset

```typescript
await service.auth.admin.generateLink({
  type: "recovery",
  email: user.email,
});
// or resetPasswordForEmail — follow Supabase JS v2 Admin API
```

---

## 5. Response DTO

```typescript
type AdminUserRow = {
  id: string;
  email: string;
  nickname: string | null;
  status: "Active" | "Disabled" | "Unconfirmed";
  registeredAt: string;
  lastSignInAt: string | null;
  assistantCount: number;
  conversationCount: number;
};
```

---

## 6. File list

| Action | Path |
|--------|------|
| Add | `app/api/admin/users/route.ts` |
| Add | `app/api/admin/users/[id]/disable/route.ts` |
| Add | `app/api/admin/users/[id]/enable/route.ts` |
| Add | `app/api/admin/users/[id]/reset-password/route.ts` |
| Add | `lib/admin/users.ts` |
| Add | `components/admin/users-manager.tsx` |

---

## 7. AC mapping

AC-120 – AC-125
