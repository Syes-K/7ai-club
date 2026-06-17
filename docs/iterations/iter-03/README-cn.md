# iter-03 — 控制台

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **迭代 ID：** `iter-03`  
> **状态：** 已交付  
> **路线图阶段：** 1 — MVP 聊天 + 配置 UI  
> **计划发布：** 2026-06-16  
> **实际发布：** 2026-06-16  
> **Git tag（可选）：** `iter-03`

---

## 1. 迭代目标

- [x] Console 壳 + 左侧菜单（Profile、Models、Assistants、Knowledge Base、MCP）
- [x] Profile：nickName + 对话模型偏好
- [x] Assistants：多助理 CRUD（Name、Icon、Opening message、System prompt）
- [x] New Chat：必选助理选择器；开场白写入首条消息
- [x] Models / 知识库 / MCP 占位页
- [x] 与首页一致的 C2 视觉
- [x] Chat 集成：客户端 session 加载 + 导航体验修复

---

## 2. 范围

### In Scope

- Feature `console` — 见 [PRD](../../features/console/01-product-requirements-cn.md)
- 聊天集成：助理选择器、Profile 模型解析、AssistantAvatar
- 数据库迁移：`user_profiles`、`assistants.user_id`、`icon`/`opening_message`、RLS
- 导航：顶栏 + UserMenu Console 入口

### Out of Scope（本迭代不做）

- RAG / 知识库上传
- MCP 连接
- Model 提供商管理 UI
- 每助理单独选模型
- OAuth、多租户
- 浏览器直连 Supabase（→ iter-04）

---

## 3. 包含的 Features

| Slug | PRD | 技术设计 | 状态 |
|------|-----|----------|------|
| `console` | [01-product-requirements-cn.md](../../features/console/01-product-requirements-cn.md) | [02-technical-design-cn.md](../../features/console/02-technical-design-cn.md) | **已交付** |

---

## 4. 迭代验收

- [x] [changelog/iter-03-cn.md](../../features/console/changelog/iter-03-cn.md) 全部 AC-01–12
- [x] `pnpm build` 通过
- [x] Supabase 迁移已执行（`20260617000000_*`, `20260617100000_*`）

**需求 vs 实现差异：** 见 [changelog/iter-03-cn.md §2](../../features/console/changelog/iter-03-cn.md)。

---

## 5. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | iter-01/02 聊天、鉴权、C2 视觉 |
| 已接受 | 旧对话仍绑定全局助理 id — 保持不变 |
| 已验证 | lazy seed 助理 — 零助理路径可用 |
| 后续 | session BFF → iter-04 浏览器 Supabase |

---

## 6. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 创建 iter-03 |
| 2026-06-16 | 标记已交付；补充 icon/opening、ChatAppShell 目标 |
