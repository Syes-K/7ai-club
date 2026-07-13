# Admin 鉴权 — 技术设计

> **English:** [admin-auth.md](./admin-auth.md)  
> **中文:** [admin-auth-cn.md](./admin-auth-cn.md)  
> **总纲:** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **PRD:** [01-product-requirements-cn.md](../01-product-requirements-cn.md) §3.3  
> **迭代:** iter-12

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

**`parseAdminEmails`：**

- 读 `process.env.ADMIN_EMAILS`
- split `,` → trim → toLowerCase → 过滤空串
- 未配置 → 开发环境 `console.warn`；生产视为无管理员（全部 403）

**`isAdminEmail`：** 大小写不敏感精确匹配

---

## 2. Middleware

`middleware.ts` matcher 增加 `/admin/:path*`。

```typescript
if (pathname.startsWith("/admin")) {
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  if (!isAdminEmail(user.email)) {
    return NextResponse.redirect(new URL("/forbidden", request.url));
    // 或 redirect /forbidden
  }
}
```

---

## 3. Layout 二次校验

`app/admin/layout.tsx`：

1. `getAdminUser()` — null → `redirect("/login?next=...")`
2. 非 admin → 渲染 `AdminForbiddenPage` 或 `notFound()`

---

## 4. API Route 模式

每个 `app/api/admin/**/route.ts` 首部：

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

`lib/admin/api.ts` — 统一 `adminErrorResponse`：`401` 未登录 · `403` 非管理员。

---

## 5. 前端入口

`SiteHeader` / `UserMenu`：`isAdminEmail(user.email)` 为 true 时显示 **Admin** 链接 → `/admin/users`。

Client 可选 `useIsAdmin()`（读 server 注入 prop），防闪烁。

---

## 6. 安全

| 项 | 规则 |
|----|------|
| `ADMIN_EMAILS` | 仅服务端；永不 `NEXT_PUBLIC_` |
| `service_role` | 仅 admin API + 既有 secrets 路径 |
| 自禁用 | API 层拒绝 `targetUserId === admin.id` |

---

## 7. 文件清单

| 操作 | 路径 |
|------|------|
| 新增 | `lib/admin/auth.ts`、`lib/admin/api.ts` |
| 新增 | `app/forbidden/page.tsx` |
| 修改 | `middleware.ts` |
| 修改 | `components/layout/site-header.tsx` |

---

## 8. AC 映射

| AC | 要点 |
|----|------|
| AC-126 | 三层校验 + API 403 |
| AC-125 | disable 自引用拒绝 |
