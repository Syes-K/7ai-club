# iter-04 — 浏览器混合数据访问

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **迭代 ID：** `iter-04`  
> **状态：** 已交付  
> **路线图阶段：** 1 — MVP 聊天（架构加固）  
> **计划发布：** 2026-06-17  
> **实际发布：** 2026-06-17  
> **Git tag（可选）：** `iter-04`

---

## 1. 迭代目标

- [x] 建立清晰的浏览器端分层：**Component → Service → Data → Supabase**
- [x] 将 CRUD 从 `/api/*` BFF 迁到 **浏览器直连 Supabase**（RLS）
- [x] **`POST /api/chat`** 保留 Node（LLM 密钥、流式）
- [x] Supabase **RPC/trigger** 处理原子多步（创建对话 + 开场白、ensure 助理）
- [x] 迁移完成后删除冗余 BFF 路由（`app/api/` 仅余 `chat`）

---

## 2. 范围

### In Scope

| 区域 | 变更 |
|------|------|
| Chat | 列表、加载 session、删/清空 → 浏览器 Supabase |
| Console | Profile、Assistants CRUD → 浏览器 Supabase |
| DB | RPC：`create_conversation_with_opening`、`ensure_user_assistants`、`delete_assistant_if_unused` |
| 文档 | [design/data-access-cn.md](../../features/mvp-chat/design/data-access-cn.md) |
| 测试 | 21 单元 + 4 iter-04 E2E + 2 smoke |

### Out of Scope

- Chat API 迁到浏览器（永远在 Node）
- RAG / MCP / 知识库
- Auth / profile 缓存、Redis
- 一次性删光所有 server data helper（RSC 可保留薄读取）

---

## 3. 包含的 Features

| Slug | Changelog | 状态 |
|------|-----------|------|
| `mvp-chat` | [changelog/iter-04-cn.md](../../features/mvp-chat/changelog/iter-04-cn.md) | **已交付** |
| `console` | （同一 changelog — 共享数据层） | **已交付** |

---

## 4. 验收

### 4.1 自动化

- [x] `pnpm lint` 通过
- [x] `pnpm build` 通过
- [x] `pnpm test` 通过（21/21）
- [x] `pnpm test:e2e` 通过（6/6，需 `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`）

### 4.2 手工 QA

见 [changelog/iter-04-cn.md §5](../../features/mvp-chat/changelog/iter-04-cn.md)。

- [x] 切换对话 Network 手测（E2E 已覆盖逻辑）
- [x] 带开场白新建对话
- [x] Console Profile / Assistants 手测
- [x] 有对话时删助理报错
- [x] 生产环境注册邮件确认链接

### 4.3 发布

- [x] changelog AC-30–34 已全部勾选
- [x] 用户确认：`测试已通过，可发布`

---

## 5. 交付摘要

| 项 | 说明 |
|----|------|
| 唯一 API 路由 | `POST /api/chat` |
| 浏览器分层 | `lib/data/browser` → `lib/services/browser` → 组件 |
| 迁移 | `20260618000000_iter04_data_access_rpc.sql`（远程已 apply） |
| 性能 | 切换会话仅拉 messages；layout 注入 preferredModel |
| 附带 | 注册回调 `/auth/callback`、E2E 会话自动清理 |

**需求 vs 实现：** 无用户可见功能变更；与 [prd/data-access-cn.md](../../features/mvp-chat/prd/data-access-cn.md) 一致。

---

## 6. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 创建 iter-04 — 混合数据访问 |
| 2026-06-17 | 实现与自动化测试完成；状态 → 待发布 |
| 2026-06-17 | lint/build/unit/e2e 全绿；文档与 changelog 同步 |
| 2026-06-17 | 手工 QA 完成；用户确认发布 → **已交付** |
