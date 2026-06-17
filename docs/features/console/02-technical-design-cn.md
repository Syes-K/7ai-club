# 控制台 — 技术设计总纲

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文:** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **项目:** 7ai-club  
> **Feature slug:** `console`  
> **迭代:** `iter-03`  
> **路线图阶段:** 1  
> **关联 PRD:** [01-product-requirements-cn.md](./01-product-requirements-cn.md)  
> **状态:** 已确认 · **已交付**  
> **文档版本:** v0.2

---

## 1. 概述

### 1.1 设计目标

实现 Console（侧栏壳、Profile、Assistants CRUD、占位页），并与聊天集成：每用户多助理、New Chat 选择器、Profile 模型解析、Icon/Opening message、客户端 Chat 壳。

### 1.2 架构对齐

| 项 | 选择 |
|----|------|
| 前端 | Next.js App Router；Console/Chat 壳以 `"use client"` 为主 |
| 鉴权 | `@supabase/ssr` + middleware 保护 `/console` |
| 数据 | Supabase PostgreSQL + RLS；iter-03 经 BFF `/api/*` |
| LLM | 扩展 `getChatModel()`，纳入 profile 偏好 |
| 视觉 | `globals.css` C2；复用 `SiteHeader`、shadcn 组件 |

---

## 2. 文档地图

| 主题 | 设计子文档 |
|------|------------|
| 壳、路由、middleware、占位 | [design/console-shell-cn.md](./design/console-shell-cn.md) |
| Profile API + UI | [design/profile-cn.md](./design/profile-cn.md) |
| Assistants schema + API + UI | [design/assistants-cn.md](./design/assistants-cn.md) |
| 聊天选择器 + ChatAppShell | [design/chat-integration-cn.md](./design/chat-integration-cn.md) |

---

## 3. 数据库摘要

| 表 / 变更 | 用途 |
|-----------|------|
| `user_profiles` | 每用户 `nickname`、`preferred_model` |
| `assistants.user_id` | NULL = 平台模板；UUID = 所有者 |
| `assistants.icon`, `opening_message` | 展示与开场白 |
| RLS | 用户 CRUD 自己的助理；legacy 助理可读 |
| 迁移 | `20260617000000_*`, `20260617100000_*` |

---

## 4. API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/profile` | Profile + Auth 邮箱 |
| PATCH | `/api/profile` | `{ nickname?, preferredModel? }` |
| GET | `/api/assistants` | 列表；空则 auto-seed |
| POST | `/api/assistants` | 新增（含 icon/opening） |
| PATCH | `/api/assistants/[id]` | 更新 |
| DELETE | `/api/assistants/[id]` | 有对话则 409 |
| POST | `/api/conversations` | body 必填 `{ assistantId }` |
| GET | `/api/conversations/[id]/session` | 聚合 session（iter-04 移除） |

---

## 5. 文件变更索引（已交付）

| 操作 | 路径 |
|------|------|
| 新增 | `supabase/migrations/20260617000000_*`, `20260617100000_*` |
| 新增 | `app/console/**`, `components/console/**` |
| 新增 | `components/chat/chat-app-shell.tsx` 等 Chat 集成 |
| 新增 | `lib/console/*`, `lib/constants/model-options.ts` |
| 新增 | `app/api/profile`, `app/api/assistants/**`, session route |
| 修改 | `middleware.ts`, `site-header.tsx`, `user-menu.tsx` |
| 修改 | `lib/chat/conversations.ts`, `lib/llm/provider.ts` |
| 删除 | `components/chat/chat-layout.tsx` |

完整清单见各子设计文档与 [changelog/iter-03-cn.md](./changelog/iter-03-cn.md) §2。

---

## 6. PRD 验收映射

| AC | 状态 |
|----|------|
| AC-01 – AC-12 | ✅ 全部通过 — 见 [changelog/iter-03-cn.md](./changelog/iter-03-cn.md) |

---

## 7. 修订记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-06-16 | v0.1 | iter-03 初稿 |
| 2026-06-16 | v0.2 | 已交付；icon/opening、ChatAppShell、session API |

---

*PRD:* [01-product-requirements-cn.md](./01-product-requirements-cn.md) · *变更:* [changelog/iter-03-cn.md](./changelog/iter-03-cn.md)
