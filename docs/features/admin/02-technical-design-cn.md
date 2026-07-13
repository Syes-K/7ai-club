# 平台后台 — 技术设计总纲

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文：** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **项目：** 7ai-club  
> **Feature slug：** `admin`  
> **迭代：** `iter-12`  
> **路线图阶段：** 2 — 平台运营  
> **关联 PRD：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)  
> **状态：** **草稿**（待确认）  
> **技术设计日期：** 2026-07-12  
> **文档版本：** v0.1

---

## 1. 概述

### 1.1 设计目标

- `/admin` 三页（Users / Models / Assistants）+ 统一 `requireAdmin()` 鉴权
- 平台免费模型入库（`platform_model_configs` + secrets）；**移除**虚拟 `PLATFORM_DEFAULT` 与 `BAILIAN_API_KEY`
- 系统助理 `assistants.is_platform`；New Chat **聚合列表**（个人在前、系统在后）
- 用户管理经 Supabase Auth Admin API（`service_role`）
- Console / Chat **交叉改造**见 [design/integration-cn.md](./design/integration-cn.md)

### 1.2 架构对齐

| 项 | 选择 |
|----|------|
| Admin UI | Next.js App Router；`components/admin/*` 参考 Console Shell |
| Admin API | `export const runtime = "nodejs"`；`/api/admin/*` |
| 鉴权 | `ADMIN_EMAILS` env + session `user.email`；middleware + layout + API 三层 |
| 平台模型 Key | AES-256-GCM（复用 `lib/llm/encryption.ts` + `platform_model_config_secrets`） |
| 用户 BYOK | **不变**（`user_model_configs`） |
| 特权数据 | `createServiceClient()` — 用户列表、ban、平台 secrets |

---

## 2. 文档地图

| 主题 | 设计子文档 |
|------|------------|
| Admin 壳与路由 | [design/admin-shell-cn.md](./design/admin-shell-cn.md) |
| 鉴权 | [design/admin-auth-cn.md](./design/admin-auth-cn.md) |
| 用户管理 | [design/users-cn.md](./design/users-cn.md) |
| 平台模型 | [design/platform-models-cn.md](./design/platform-models-cn.md) |
| 平台助理 + 选择器 | [design/platform-assistants-cn.md](./design/platform-assistants-cn.md) |
| Console / Chat 集成 | [design/integration-cn.md](./design/integration-cn.md) |

**交叉 feature 设计增量：**

| Feature | 文档 |
|---------|------|
| `console` | [console/design/models-cn.md](../console/design/models-cn.md) §14 · [console/changelog/iter-12-cn.md](../console/changelog/iter-12-cn.md) |
| `mvp-chat` | [mvp-chat/design/chat-model-config-cn.md](../mvp-chat/design/chat-model-config-cn.md) §10 |

---

## 3. 数据库摘要（iter-12）

| 对象 | 说明 |
|------|------|
| `platform_model_configs` | 平台免费模型元数据 |
| `platform_model_config_secrets` | 加密 API Key（仅 service_role） |
| `assistants.is_platform` | 系统助理标记 |
| `assistants.enabled` | 平台助理对用户可见性 |
| `user_profiles` | 放宽 `preferred_model_config_id` FK；可指向平台或用户配置 |
| Migration | `supabase/migrations/20260712000000_iter12_platform_admin.sql` |

详见 [design/platform-models-cn.md](./design/platform-models-cn.md) · [design/platform-assistants-cn.md](./design/platform-assistants-cn.md)。

---

## 4. API 摘要

| 前缀 | 鉴权 | 说明 |
|------|------|------|
| `/api/admin/users` | `requireAdmin()` | 列表、disable、enable、reset-password |
| `/api/admin/models` | `requireAdmin()` | 平台模型 CRUD、key、test |
| `/api/admin/assistants` | `requireAdmin()` | 平台助理 CRUD |

浏览器 **不**直连平台 secrets；用户读平台模型元数据经 RLS `SELECT`（authenticated）。

---

## 5. 文件变更清单（索引）

| 操作 | 路径 |
|------|------|
| 新增 | `app/admin/**`、`components/admin/**`、`lib/admin/**` |
| 新增 | `app/api/admin/**` |
| 新增 | `supabase/migrations/20260712000000_iter12_platform_admin.sql` |
| 修改 | `middleware.ts`、`components/layout/site-header.tsx`（Admin 入口） |
| 修改 | `lib/console/model-configs*.ts`、`lib/llm/resolve-user-model.ts`、`lib/llm/provider.ts` |
| 修改 | `lib/services/browser/assistants.ts`、`components/chat/assistant-picker-dialog.tsx` |
| 修改 | `lib/services/browser/profile.ts`、`components/console/preferences-card.tsx` |
| 新增 | `tests/unit/admin/**`、`tests/e2e/iter12-admin.spec.ts` |
| 移除 | `BAILIAN_API_KEY` 读取路径、`PLATFORM_DEFAULT` 虚拟注入、`ensure_user_assistants` 复制逻辑 |

完整列表见各子文档 §9。

---

## 6. 环境变量

| 变量 | 说明 |
|------|------|
| `ADMIN_EMAILS` | **新增** — 逗号分隔管理员邮箱 |
| `LLM_ENCRYPTION_KEY` | 已有 — 平台 + 用户 Key 加密 |
| `SUPABASE_SERVICE_ROLE_KEY` | 已有 — Admin API、secrets |
| `BAILIAN_API_KEY` | **废弃** — 从 `.env.example` / README 移除 |

---

## 7. 测试计划（§11 摘要）

| 类型 | 路径 |
|------|------|
| Unit | `tests/unit/admin/auth.test.ts`、`resolve-platform-model.test.ts` |
| E2E | `tests/e2e/iter12-admin.spec.ts` |
| 回归 | 既有 `model-config`、`assistants` 单测更新 |

---

## 8. 开放问题决议

| ID | 问题 | 决议 |
|----|------|------|
| OQ-D01 | `preferred_model_config_id` 如何引用平台 UUID | **移除对用户表 FK**；应用层解析：先查 `user_model_configs`（须 `user_id` 匹配），再查 `platform_model_configs`（须 passed+enabled） |
| OQ-D02 | `preferred NULL` 迁移 | 设为第一条 `passed+enabled+chat` 平台模型 ID；无则保持 NULL |
| OQ-D03 | `ensure_user_assistants` RPC | **改为 no-op**：仅 `SELECT` 用户助理并返回，不 INSERT |
| OQ-D04 | 禁用用户 | `auth.admin.updateUserById` + `ban_duration`；解禁 `ban_duration: 'none'` |
| OQ-D05 | Admin UI 风格 | shadcn/ui + 复用 Console 布局模式；不单独跑 design-system 页面 override |

---

## 9. PRD 验收映射（§12 · iter-12）

> qa-engineer C0 输入。主 AC 在 admin changelog；Console/MVP 回归见 [integration-cn.md](./design/integration-cn.md) §12。

| AC ID | 实现要点 | 验证方式 |
|-------|----------|----------|
| AC-120 | `GET /api/admin/users` 分页 + join `user_profiles` + 计数 | unit + e2e |
| AC-121 | 查询参数 `q` debounce 搜索 email/nickname | unit |
| AC-122 | `POST .../disable` → `ban_duration` | unit + manual |
| AC-123 | `POST .../enable` → 清除 ban | unit |
| AC-124 | `POST .../reset-password` → Auth Admin 发邮件 | manual |
| AC-125 | disable 拒绝 `user.id === admin.id` | unit |
| AC-126 | 非 admin → middleware/layout/API 403 | e2e |
| AC-127 | `platform_model_configs` CRUD + secrets 加密 | unit + e2e |
| AC-128 | test 接口；仅 passed+enabled 对用户可选 | unit |
| AC-129 | Profile 下拉合并平台 passed 行 | e2e |
| AC-130 | Console Models 只读 Platform 行 | e2e |
| AC-131 | `resolveUserModelForChat` 解密平台 Key | unit |
| AC-132 | 删除 `buildPlatformDefaultResolved` env 路径 | unit + grep |
| AC-133 | BYOK `/api/models` 回归 | 既有 test |
| AC-134 | `/api/admin/assistants` CRUD | e2e |
| AC-135 | `listAssistantOptions` 聚合排序 + Platform badge | unit + e2e |
| AC-136 | 平台 `assistantId` 创建对话 | e2e |
| AC-137 | RPC no-op；无模板复制 | unit + Supabase MCP |
| AC-138 | 个人条目排在系统前 | unit |
| AC-139 | Chat workflow 仍 `resolveUserModelForChat` | unit |
| AC-140 | `enabled=false` 不进入列表查询 | unit |
| AC-141 | `/api/admin/assistants` 非 admin 403 | e2e |

---

## 10. 修订记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-07-12 | v0.1 | iter-12 初稿 |

---

*迭代索引：* [iter-12/README-cn.md](../../iterations/iter-12/README-cn.md)
