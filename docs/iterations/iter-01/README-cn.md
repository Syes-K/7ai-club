# iter-01 — MVP 聊天

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **迭代 ID：** `iter-01`  
> **状态：** 进行中  
> **路线图阶段：** 1 — MVP 聊天  
> **计划发布：** —  
> **实际发布：** —  
> **Git tag（可选）：** `v0.1.0`

---

## 1. 迭代目标

- 落地 Next.js + Supabase Auth + Vercel AI SDK 技术栈脚手架
- 交付极简 AI 聊天闭环：注册/登录 → 流式对话 → 历史持久化
- 验证 SiliconFlow（OpenAI 兼容）+ `Qwen/Qwen2.5-7B-Instruct` 集成

---

## 2. 范围

### In Scope

- Next.js App Router 脚手架、Tailwind、shadcn/ui 基础
- Supabase Auth（邮箱/密码）、middleware、RLS
- 固定默认助理、对话与消息表
- 流式 Chat API（SiliconFlow）+ 聊天 UI（Dark）
- 历史对话列表、新建对话、继续聊天

### Out of Scope（本迭代不做）

- 助理 CRUD、系统提示词编辑 UI
- 知识库 / RAG、MCP、Agent 多步
- 多模型切换、OAuth / Magic Link
- 限流、可观测性、生产加固

---

## 3. 包含的 Features

| Feature slug | PRD | 技术设计 | 优先级 | 本迭代状态 |
|--------------|-----|----------|--------|------------|
| `mvp-chat` | [01-product-requirements.md](../../features/mvp-chat/01-product-requirements.md) · [01-product-requirements-cn.md](../../features/mvp-chat/01-product-requirements-cn.md) | [02-technical-design.md](../../features/mvp-chat/02-technical-design.md) · [02-technical-design-cn.md](../../features/mvp-chat/02-technical-design-cn.md) | P0 | 开发完成 |

路径约定：文档在 `docs/features/<slug>/`，**不在**迭代文件夹内重复存放 PRD/设计。

---

## 4. 迭代验收标准

- [ ] 本地 `next dev` 可完成注册 → 登录 → 流式聊天 → 刷新后历史仍在
- [ ] Supabase RLS 隔离不同用户对话
- [ ] `.env.example` 含 Supabase 与 SiliconFlow 所需变量说明
- [ ] Vercel 部署可访问（或文档说明部署步骤）

---

## 5. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | Supabase 项目、SiliconFlow API Key、Vercel 账号 |
| 风险 | SiliconFlow 可用性与延迟；缓解：错误态友好提示，技术设计设 fetch 超时 |

---

## 6. 发布记录

| 日期 | 事件 | 备注 |
|------|------|------|
| 2026-06-14 | 迭代启动 | PRD 对焦完成 |

---

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-14 | 创建 iter-01 |
