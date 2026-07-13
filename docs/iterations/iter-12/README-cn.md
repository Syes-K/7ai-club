# iter-12 — 平台后台 Admin

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **迭代 ID:** `iter-12`  
> **状态:** **已发布**  
> **路线图阶段:** 2 — 平台运营  
> **计划发布:** 2026-07-13  
> **实际发布:** 2026-07-13  
> **Git tag（可选）:** `iter-12`  
> **前置:** [iter-11](../iter-11/README-cn.md) **已发布**

---

## 1. 迭代目标

- [x] `/admin` 路由 + `ADMIN_EMAILS` 白名单鉴权
- [x] 用户管理：列表、禁用/启用（~~密码重置~~ → [todoList AUTH-01](../../todoList/backlog-cn.md)）
- [x] 平台免费模型：Admin CRUD；废弃 `BAILIAN_API_KEY` 虚拟默认
- [x] 平台助理：Admin CRUD；New Chat 聚合列表（系统排后）；移除自动 seed
- [x] 迭代内手工修复（见 [admin/changelog/iter-12-cn.md §7](../../features/admin/changelog/iter-12-cn.md)）
- [x] QA C4 验收勾选（AC-120–123、125–141；AC-124 移出范围）
- [x] 用户 `测试已通过，可发布`

---

## 2. 范围

### In Scope

| 区域 | 变更摘要 |
|------|----------|
| **路由** | `app/admin/*` — users、models、assistants |
| **鉴权** | middleware + layout + `/api/admin/*` 统一 `requireAdmin()` |
| **用户** | 分页列表、搜索、禁用、启用 |
| **平台模型** | Key 加密、测试门禁、Enable/Disable、Profile / Console 集成 |
| **平台助理** | `is_platform`、聚合选择器（个人在前） |
| **封禁** | 用户 Disable 后 middleware 拦截页面与 API（`lib/auth/session`） |
| **迁移** | 移除虚拟 `PLATFORM_DEFAULT`；平台助理 RPC |
| **测试** | admin 流程 unit + e2e |
| **文档** | Feature PRD、changelog、技术设计、`docs/todoList/` |

### Out of Scope

- Admin 代发密码重置（→ todoList **AUTH-01**）
- 多角色 RBAC
- 平台助理挂载 KB / MCP
- Admin 数据大盘
- OAuth 提供方管理

---

## 3. 包含的 Features

| Slug | PRD | 技术设计 | 优先级 | 本迭代状态 |
|------|-----|----------|--------|------------|
| `admin` | [01-product-requirements-cn.md](../../features/admin/01-product-requirements-cn.md) | [02-technical-design-cn.md](../../features/admin/02-technical-design-cn.md) | P0 | **开发完成 + 迭代内修复** |

**交叉 changelog（同迭代）：**

| Feature | Changelog |
|---------|-----------|
| `console` | [changelog/iter-12-cn.md](../../features/console/changelog/iter-12-cn.md) |
| `mvp-chat` | [changelog/iter-12-cn.md](../../features/mvp-chat/changelog/iter-12-cn.md) |

文档在 `docs/features/admin/` — 不在迭代目录重复存放。

---

## 4. 验收

### 4.1 自动化（qa Phase C2）

- [x] `pnpm lint`
- [x] `pnpm build`
- [x] `pnpm test`（含 `auth/session`、`profile-defaults`、`resolve-user-model` 等增量）
- [x] `pnpm test:e2e`（35 passed，15 skipped）

### 4.2 手工 QA（qa Phase C0 + C3）

- [x] changelog **§5.1 Test Matrix** 已填写（C0）
- [x] changelog **§12 Manual Script** 已执行（C3）
- [x] 迭代内手工修复 **H-01–H-10** 已记录于 [admin changelog §7](../../features/admin/changelog/iter-12-cn.md)
- [x] AC-120–141 全部勾选（AC-124 移出范围）— **qa-engineer C4 2026-07-13**

### 4.3 发布

- [x] changelog §5 AC 已全部勾选（qa-engineer C4；AC-124 除外）
- [x] 用户确认：`测试已通过，可发布`（2026-07-13）

---

## 5. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | iter-11 已发布；`SUPABASE_SERVICE_ROLE_KEY`、`LLM_ENCRYPTION_KEY`、`ADMIN_EMAILS` |
| 已缓解 | 新用户默认模型未落库（H-01）；平台模型 Disable 无回退（H-03）；封禁未拦截 API（H-06） |
| 环境变量 | `ADMIN_EMAILS`；部署文档移除 `BAILIAN_API_KEY` |

---

## 6. 门禁记录

| 日期 | 事件 |
|------|------|
| 2026-07-12 | iter-12 立项；PRD 确认（Q1–Q7） |
| 2026-07-12 | 技术设计确认；Phase B 编码交付 |
| 2026-07-13 | QA C4 完成；21/22 AC 勾选（AC-124 → AUTH-01）；lint/build/test/e2e 全通过 |
| 2026-07-13 | 迭代内手工修复 H-01–H-10；移除 Admin 密码重置 → todoList |
| 2026-07-13 | 用户确认 `测试已通过，可发布`；**迭代已发布** |

---

## 7. 迭代内手工修复索引

完整表见 [admin/changelog/iter-12-cn.md §7](../../features/admin/changelog/iter-12-cn.md)。

| ID | 摘要 |
|----|------|
| H-01 | 新用户 Profile 默认模型落库 |
| H-02 | 平台模型 label 与 Console 对齐 |
| H-03 | 平台模型 Disable 后偏好回退 |
| H-04 | Admin Models **Enable** 按钮 |
| H-05 | Users Status 读 `banned_until` |
| H-06 | 封禁用户 middleware 统一拦截 |
| H-07 | 移除 Admin 密码重置 → AUTH-01 |
| H-08 | 平台助理建会话 RPC |
| H-09 | `/forbidden` 重定向循环 |
| H-10 | `docs/todoList/` 流程 |

---

## 8. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-12 | 创建 iter-12 |
| 2026-07-13 | 同步 §7 手工修复；状态 → 待 C4；Out of Scope 密码重置 |
| 2026-07-13 | 用户确认发布；标 **已发布** |
