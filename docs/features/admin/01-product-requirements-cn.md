# 平台后台 — 产品需求总纲

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **项目：** 7ai-club  
> **Feature slug：** `admin`  
> **迭代：** `iter-12` — 见 [iter-12 README](../../iterations/iter-12/README-cn.md)  
> **路线图阶段：** 2 — 平台运营  
> **状态：** **已确认**  
> **PRD 确认日期：** 2026-07-12  
> **文档版本：** v0.1

---

## 1. 执行摘要

为平台运营人员提供 **`/admin` 后台**：仅环境变量 `ADMIN_EMAILS` 中配置的管理员邮箱可访问。布局参考现有 Console Shell，所有 `/admin` 页面与 `/api/admin/*` 请求经**统一管理员校验**。本迭代交付 **用户管理**、**平台免费模型**、**平台 Assistant** 三个子能力，并将原基于 env 的虚拟平台默认模型与自动 seed 助理逻辑迁移为可后台配置、**全体用户可选**的平台资源。

**用户可见 UI 文案为 English。**

---

## 2. 背景与目标

### 2.1 背景

- 架构文档已规划 `app/admin/`（shadcn/ui），尚未实现
- 平台默认 LLM 现为服务层虚拟行 + `BAILIAN_API_KEY` env，无法运营侧动态调整
- 平台助理现为 `user_id IS NULL` 模板，仅用于 seed 复制到用户，用户无法直接选用系统助理

### 2.2 目标

- 管理员可在后台查看并操作用户账号（禁用、重置密码）
- 管理员可 CRUD 7ai 提供的免费模型；普通用户在 Profile / Chat 中可选择
- 管理员可 CRUD 系统助理；普通用户在 New Chat **聚合列表**中选用（系统助理排在个人之后）
- **完全废弃** `BAILIAN_API_KEY` 及虚拟 `PLATFORM_DEFAULT` 行

### 2.3 非目标（Out of Scope）

- 多角色 RBAC、权限分级
- 组织 / 多租户
- 用户 BYOK 模型管理（仍在 `/console/models`）
- 用户私有助理管理（仍在 `/console/assistants`）
- 平台助理 per-assistant model（与 Console 一致，沿用 Profile 模型偏好）
- 平台助理挂载知识库 / MCP（本迭代）
- Admin 内 Analytics / 审计日志大盘
- OAuth 提供方管理

---

## 3. 全局约定

### 3.1 路由

| 路径 | 页面 | 鉴权 |
|------|------|------|
| `/admin` | 重定向 → `/admin/users` | 管理员 |
| `/admin/users` | 用户列表与管理 | 管理员 |
| `/admin/models` | 平台免费模型 | 管理员 |
| `/admin/assistants` | 平台 Assistant | 管理员 |

### 3.2 导航

- **入口：** 仅管理员登录后顶栏或 UserMenu 显示 **Admin** 链接（非管理员不可见）
- **Admin 壳：** 左侧菜单 — Users → Models → Assistants（参考 Console Shell）
- **互链：** Admin 顶栏保留 **Chat**、**Console** 链接

### 3.3 管理员鉴权

| 项 | 规则 |
|----|------|
| 配置 | 环境变量 `ADMIN_EMAILS`，多个邮箱逗号分隔 |
| 匹配 | trim + **大小写不敏感**；与 `auth.users.email` 比对 |
| 未登录访问 `/admin` | 跳转 `/login?next=<path>` |
| 已登录非管理员 | **403 页面**（English：*"You do not have permission to access this area."*） |
| Middleware | 保护 `/admin/*` 路径前缀 |
| Layout | Server Component 二次校验 |
| API | 所有 `/api/admin/*` 经统一 `requireAdmin()`；否则 `401` / `403` |
| 前端 | Layout 挡 unauthorized；Admin Shell 可选 client guard 防闪烁 |

### 3.4 权限矩阵

| 操作 | 管理员 | 普通用户 |
|------|--------|----------|
| 访问 `/admin/*` | 是 | 否 |
| 调用 `/api/admin/*` | 是 | 否 |
| 查看全站用户 | 是 | 否 |
| 禁用 / 启用用户 | 是 | 否 |
| 触发用户密码重置 | 是 | 否 |
| CRUD 平台模型 | 是 | 否 |
| CRUD 平台助理 | 是 | 否 |
| 选用平台模型（Profile） | — | 是（Passed 项） |
| 选用系统助理（New Chat） | — | 是（只读） |
| CRUD 自有模型 / 助理 | — | 是（Console） |

### 3.5 平台资源与用户资源边界

| 资源 | 存储标识 | 用户可见 | 用户可编辑 |
|------|----------|----------|------------|
| 平台免费模型 | `platform_model_configs`（技术设计定名） | Profile / Console Models 列表 | 否 |
| 用户 BYOK 模型 | `user_model_configs` | 本人 | 是 |
| 系统助理 | `assistants.is_platform = true` | New Chat 列表（个人之后） | 否 |
| 个人助理 | `assistants.user_id = auth.uid()` | New Chat 列表（系统之前） | 是 |

### 3.6 模型解析（聊天）

与 Console 一致：**不支持** per-assistant model。Chat 使用 Profile 选中的 **Passed** 模型配置（含平台免费模型或用户 BYOK）。

### 3.7 非功能（摘要）

- 渲染：Admin 页面可使用客户端组件
- 安全：平台模型 API Key **AES 加密**存 DB；仅 `service_role` + admin API 可写；`ADMIN_EMAILS` 仅服务端读取
- 语言：用户可见 UI **English**
- 性能：用户列表支持分页（默认每页 20）

### 3.8 功能索引

| ID | 功能 | 详细 PRD | 迭代 |
|----|------|----------|------|
| F-30 | Admin 壳与鉴权 | 本文 §3 | iter-12 |
| F-31 | 用户管理 | [prd/users-cn.md](./prd/users-cn.md) | iter-12 |
| F-32 | 平台免费模型 | [prd/models-cn.md](./prd/models-cn.md) | iter-12 |
| F-33 | 平台 Assistant | [prd/assistants-cn.md](./prd/assistants-cn.md) | iter-12 |
| F-34 | New Chat 聚合选择器 | [prd/assistants-cn.md](./prd/assistants-cn.md) §4 | iter-12 |

---

## 4. 文档地图

| 文档 | 范围 |
|------|------|
| [prd/users-cn.md](./prd/users-cn.md) | 用户列表、禁用、密码重置 |
| [prd/models-cn.md](./prd/models-cn.md) | 平台免费模型 CRUD、迁移 |
| [prd/assistants-cn.md](./prd/assistants-cn.md) | 平台助理 CRUD、聚合选择器 |
| [changelog/iter-12-cn.md](./changelog/iter-12-cn.md) | iter-12 增量、AC-120–141 |

技术总纲：待 `02-technical-design-cn.md`（fullstack-developer Phase A）

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-12 | 初稿；用户确认 Q1–Q7 |
