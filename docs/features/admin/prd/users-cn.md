# 用户管理

> **English:** [users.md](./users.md)  
> **中文：** [users-cn.md](./users-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-12

---

## 1. 范围

F-31 — `/admin/users`：管理员查看全站注册用户，支持**禁用账号**与**触发密码重置**。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-40 | 作为管理员，我希望查看所有用户及其状态，以便掌握平台用户情况 | P0 |
| US-41 | 作为管理员，我希望禁用违规用户账号，使其无法登录和使用服务 | P0 |
| US-42 | 作为管理员，我希望为忘记密码的用户触发重置邮件 | P0 → **已移出 iter-12**；见 [AUTH-01](../../../../todoList/backlog-cn.md)（用户自助找回密码） |
| US-43 | 作为管理员，我希望重新启用已禁用用户 | P1 |

---

## 3. F-31 Users 页

### 3.1 路由与布局

- 路由：`/admin/users`
- 页面标题（English）：**User management**
- 主区：可搜索、分页的用户表格

### 3.2 列表字段

| 列（English） | 说明 |
|---------------|------|
| Email | `auth.users.email` |
| Nickname | `user_profiles.nickname`；空显示 `—` |
| Status | `Active` · `Disabled` · `Unconfirmed`（邮箱未确认） |
| Registered | `created_at`，本地化日期 |
| Last sign-in | `last_sign_in_at`；从未登录显示 `Never` |
| Assistants | 个人助理数量（`user_id = uid`） |
| Conversations | 对话数量 |
| Actions | 见 §3.4 |

**默认排序：** 注册时间降序。  
**分页：** 每页 20 条；底部分页控件。

### 3.3 搜索

- 顶部搜索框（English placeholder：*"Search by email or nickname"*）
- 匹配 email（前缀/包含）或 nickname（包含）；debounce 300ms
- 空结果：*"No users match your search."*

### 3.4 操作（Actions）

| 操作 | 条件 | 行为 |
|------|------|------|
| **Disable** | Status = Active；且非当前登录管理员本人 | 确认对话框 → 调用 admin API → 用户无法再登录；已有 session 在下次刷新时失效 |
| **Enable** | Status = Disabled | 确认 → 恢复可登录 |
| **—** | 目标为当前管理员本人 | Disable 按钮禁用；tooltip：*"You cannot disable your own account."* |

> **iter-12 起：** Admin「Send password reset」已移除。用户自助找回密码 → [todoList AUTH-01](../../../../todoList/backlog-cn.md)。

**确认对话框（English）示例：**

- Disable：*"Disable {email}? This user will not be able to sign in."*
- Enable：*"Re-enable {email}?"*

### 3.5 禁用语义

- 使用 Supabase Auth **ban** 机制（技术设计选定 `ban_duration` 或等效 Admin API）
- 禁用后：
  - 登录失败，英文错误：*"Your account has been disabled. Contact support."*
  - 已登录用户 middleware / `getUser()` 应拒绝访问受保护路由
- **不禁用**其历史对话与数据（软封禁，非删号）

### 3.6 密码重置（Out of scope · iter-12）

- **不在 Admin Users 提供**；后续以用户自助「Forgot password」交付，见 [todoList AUTH-01](../../../../todoList/backlog-cn.md)

### 3.7 API（产品层）

所有经 `/api/admin/users/*`，须 `requireAdmin()`：

| 能力 | 说明 |
|------|------|
| `GET` 列表 | 分页 + 搜索；`service_role` 读 `auth.users` + join `user_profiles` + 聚合统计 |
| `POST` disable | `userId` |
| `POST` enable | `userId` |
| `POST` reset-password | `userId` 或 `email` |

### 3.8 边界与异常

| 场景 | 期望 |
|------|------|
| 非管理员访问页面 | 403 |
| 禁用自己 | 按钮禁用 |
| 重复禁用 | 幂等或提示已禁用 |
| 用户不存在 | 404 |
| 列表加载失败 | 页面级错误 + Retry |

---

## 4. 验收标准

- [ ] **AC-120** — 管理员可查看分页用户列表及 §3.2 字段
- [ ] **AC-121** — 可按 email / nickname 搜索
- [ ] **AC-122** — 可禁用用户；被禁用用户无法登录
- [ ] **AC-123** — 可重新启用已禁用用户
- [ ] **AC-124** — ~~可触发密码重置邮件~~ **已移出 iter-12** → [AUTH-01](../../../../todoList/backlog-cn.md)
- [ ] **AC-125** — 管理员不能禁用自己
- [ ] **AC-126** — 非管理员无法访问 `/admin/users` 及 users API

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-12 | 初稿 |
