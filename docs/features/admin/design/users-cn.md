# 用户管理 — 技术设计

> **English:** [users.md](./users.md)  
> **中文:** [users-cn.md](./users-cn.md)  
> **总纲:** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **PRD:** [prd/users-cn.md](../prd/users-cn.md)  
> **迭代:** iter-12

---

## 1. API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/users` | 分页列表 + 搜索 |
| POST | `/api/admin/users/[id]/disable` | Ban 用户 |
| POST | `/api/admin/users/[id]/enable` | 解除 ban |
| POST | `/api/admin/users/[id]/reset-password` | 发送重置邮件 |

**Query（GET）：**

| 参数 | 默认 | 说明 |
|------|------|------|
| `page` | 1 | 页码 |
| `perPage` | 20 | 每页条数 |
| `q` | — | email / nickname 模糊搜索 |

---

## 2. 实现

使用 `createServiceClient().auth.admin`：

```typescript
// 列表（分页）
const { data, error } = await service.auth.admin.listUsers({
  page,
  perPage,
});
```

**聚合 `user_profiles`：** 批量 `user_id IN (...)` 查 nickname。

**计数：**

```sql
SELECT user_id, COUNT(*) FROM assistants WHERE user_id IS NOT NULL GROUP BY user_id;
SELECT user_id, COUNT(*) FROM conversations GROUP BY user_id;
```

或在 API 层对当前页用户并行 count（MVP 可接受 N+1 仅 20 条）。

**Status 推导：**

| 条件 | Status |
|------|--------|
| `ban_duration` 有效 | `Disabled` |
| `email_confirmed_at` 空 | `Unconfirmed` |
| 否则 | `Active` |

---

## 3. Disable / Enable

```typescript
await service.auth.admin.updateUserById(userId, {
  ban_duration: "876000h", // ~100y 软封禁
});

await service.auth.admin.updateUserById(userId, {
  ban_duration: "none",
});
```

**自禁用：** `if (userId === admin.id) return 400`。

---

## 4. Password Reset

```typescript
await service.auth.admin.generateLink({
  type: "recovery",
  email: user.email,
});
// 或 resetPasswordForEmail — 以 Supabase JS v2 Admin API 为准
```

---

## 5. 响应 DTO

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

## 6. 文件清单

| 操作 | 路径 |
|------|------|
| 新增 | `app/api/admin/users/route.ts` |
| 新增 | `app/api/admin/users/[id]/disable/route.ts` |
| 新增 | `app/api/admin/users/[id]/enable/route.ts` |
| 新增 | `app/api/admin/users/[id]/reset-password/route.ts` |
| 新增 | `lib/admin/users.ts` |
| 新增 | `components/admin/users-manager.tsx` |

---

## 7. AC 映射

AC-120 – AC-125
