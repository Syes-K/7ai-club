# Admin Auth — Technical Design

> **English:** [admin-auth.md](./admin-auth.md)  
> **中文:** [admin-auth-cn.md](./admin-auth-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **PRD:** [01-product-requirements.md](../01-product-requirements.md) §3.3  
> **Iteration:** iter-12

---

## 1. `lib/admin/auth.ts`

```typescript
export function parseAdminEmails(): string[];

export function isAdminEmail(email: string | null | undefined): boolean;

export async function getAdminUser(): Promise<User | null>;
// getUser() + isAdminEmail → User | null

export async function requireAdmin(): Promise<User>;
// throws AdminForbiddenError | UnauthorizedError

export class AdminForbiddenError extends Error {}
```

**`parseAdminEmails`:**

- Read `process.env.ADMIN_EMAILS`
- Split on `,` → trim → toLowerCase → filter empty strings
- If unset → `console.warn` in development; production treats as no admins (all 403)

**`isAdminEmail`:** case-insensitive exact match

---

## 2. Middleware

Add `/admin/:path*` to `middleware.ts` matcher.

```typescript
if (pathname.startsWith("/admin")) {
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.redirect(new URL("/forbidden", request.url));
    // or redirect /forbidden
  }
}
```

---

## 3. Layout re-check

`app/admin/layout.tsx`:

1. `getAdminUser()` — null → `redirect("/login?next=...")`
2. Not admin → render `AdminForbiddenPage` or `notFound()`

---

## 4. API route pattern

Every `app/api/admin/**/route.ts` starts with:

```typescript
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    // ...
  } catch (e) {
    return adminErrorResponse(e);
  }
}
```

`lib/admin/api.ts` — shared `adminErrorResponse`: `401` unauthenticated · `403` not admin.

---

## 5. Frontend entry

`SiteHeader` / `UserMenu`: when `isAdminEmail(user.email)` is true, show **Admin** link → `/admin/users`.

Optional client `useIsAdmin()` (from server-injected prop) to avoid flicker.

---

## 6. Security

| Item | Rule |
|------|------|
| `ADMIN_EMAILS` | Server-only; never `NEXT_PUBLIC_` |
| `service_role` | Admin API + existing secrets paths only |
| Self-disable | API rejects `targetUserId === admin.id` |

---

## 7. File list

| Action | Path |
|--------|------|
| Add | `lib/admin/auth.ts`, `lib/admin/api.ts` |
| Add | `app/forbidden/page.tsx` |
| Modify | `middleware.ts` |
| Modify | `components/layout/site-header.tsx` |

---

## 8. AC mapping

| AC | Notes |
|----|-------|
| AC-126 | Three-layer check + API 403 |
| AC-125 | Reject self-disable |
