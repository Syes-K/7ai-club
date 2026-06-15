# iter-01 — MVP 聊天

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **迭代 ID：** `iter-01`  
> **状态：** 本地迭代完成  
> **路线图阶段：** 1 — MVP 聊天  
> **计划发布：** —  
> **本地验收：** 2026-06-14  
> **生产部署：** 进行中（`7ai-club.vercel.app`）  
> **Git tag（可选）：** `v0.1.0`

---

## 1. 迭代目标

- [x] 落地 Next.js + Supabase Auth + Vercel AI SDK 技术栈
- [x] 交付极简 AI 聊天闭环：注册/登录 → 流式对话 → 历史持久化
- [x] 验证 OpenAI 兼容 LLM 集成（SiliconFlow、NVIDIA NIM、阿里百炼）

---

## 2. 范围

### In Scope（已交付）

- Next.js App Router 脚手架、Tailwind、shadcn/ui 基础
- Supabase Auth（邮箱/密码）、middleware、RLS
- 固定默认助理、`conversations` + `messages` 表
- 流式 Chat API + 聊天 UI（Dark、英文文案）
- 历史对话列表、新建对话、继续聊天
- 环境变量切换 LLM 提供商（`lib/llm/provider.ts`）
- LLM 请求超时 + Vercel 部署错误提示优化

### Out of Scope（延后）

- 助理 CRUD、系统提示词编辑 UI
- 知识库 / RAG、MCP、Agent 多步
- 应用内模型切换 UI（当前仅 env 配置）
- OAuth / Magic Link
- 限流、可观测性、生产加固

---

## 3. 包含的 Features

| Feature slug | PRD | 技术设计 | 优先级 | 状态 |
|--------------|-----|----------|--------|------|
| `mvp-chat` | [01-product-requirements.md](../../features/mvp-chat/01-product-requirements.md) · [01-product-requirements-cn.md](../../features/mvp-chat/01-product-requirements-cn.md) | [02-technical-design.md](../../features/mvp-chat/02-technical-design.md) · [02-technical-design-cn.md](../../features/mvp-chat/02-technical-design-cn.md) | P0 | 本地完成 |

功能概览：[docs/features/mvp-chat/README-cn.md](../../features/mvp-chat/README-cn.md)

---

## 4. 迭代验收标准

### 本地开发（已验证）

- [x] `pnpm dev`：注册 → 登录 → 流式聊天 → 刷新后历史仍在
- [x] Supabase RLS 隔离不同用户对话
- [x] `.env.example` 含 Supabase 与多提供商 LLM 变量说明
- [x] LLM 失败时聊天 UI 显示可读错误（非白屏）

### 生产 / Vercel（部分完成）

- [x] 应用可部署到 Vercel；认证与聊天页可访问
- [ ] 生产环境流式聊天稳定（NVIDIA NIM 曾挂起 → 建议 Bailian/SiliconFlow + 配置 env 后 Redeploy）

### PRD 验收映射（本地）

| ID | 标准 | 本地 |
|----|------|------|
| AC-01 | `/chat` 需登录 | 通过 |
| AC-02 | 注册后自动登录进入 `/chat` | 通过 |
| AC-03 | AI 流式回复 | 通过 |
| AC-04 | 刷新后消息仍在 | 通过 |
| AC-05 | 侧边栏历史与切换 | 通过 |
| AC-06 | 新建空白对话 | 通过 |
| AC-07 | LLM 错误提示 | 通过 |
| AC-08 | RLS 用户隔离 | 通过（设计已覆盖；建议双账号手测） |
| AC-09 | 固定 Qwen + SiliconFlow | **已替代** — 多提供商 `LLM_PROVIDER` / `LLM_MODEL` |

---

## 5. 本地开发检查清单

```bash
pnpm install
cp .env.example .env.local
```

1. 填写 `NEXT_PUBLIC_SUPABASE_*` 与一个 LLM 密钥（如 `BAILIAN_API_KEY` + `LLM_PROVIDER=bailian`）
2. 执行 `supabase/migrations/20260614000000_mvp_chat.sql`
3. `pnpm dev` → http://localhost:3000
4. 注册 → 聊天 → 刷新 → 确认历史

**推荐本地提供商：** `bailian` + `qwen3.6-plus`（或 `siliconflow`）

**超时默认：** `LLM_TIMEOUT_MS=120000`，`/api/chat` `maxDuration=130`

---

## 6. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | Supabase 项目、LLM API Key（百炼 / SiliconFlow / NVIDIA）、Vercel 部署 |
| 本地已解决 | 认证、流式、持久化、多提供商抽象 |
| 待观察 | Vercel 上 NVIDIA NIM 可能挂至平台超时；缓解：LLM 超时 + 切换提供商 |
| 待观察 | Vercel 生产域名需在 Supabase Auth 配置 Site URL / Redirect URLs |

---

## 7. 发布记录

| 日期 | 事件 | 备注 |
|------|------|------|
| 2026-06-14 | 迭代启动 | PRD + 技术设计确认 |
| 2026-06-14 | MVP 脚手架 | `ec34046` — 认证、聊天 UI、SiliconFlow/NVIDIA |
| 2026-06-14 | Vercel 修复 | `8ae8e7a` — 环境校验、错误提示、`vercel.json` |
| 2026-06-14 | 百炼 + 超时 | `5c4a91e` — Bailian provider、120s LLM 超时 |
| 2026-06-14 | **本地迭代完成** | 本地 E2E 通过；生产 LLM 提供商待确认 |

---

## 8. 后续步骤（iter-01 本地之后）

1. Vercel：配置 `LLM_PROVIDER=bailian`、`BAILIAN_API_KEY`、`LLM_TIMEOUT_MS=120000` → Redeploy
2. Supabase Auth：添加 `https://7ai-club.vercel.app` 到 Site URL / Redirect URLs
3. 可选：生产聊天验证通过后打 tag `v0.1.0`
4. iter-02 规划：助理配置 UI 或生产加固 — 待定

---

## 9. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-14 | 创建 iter-01 |
| 2026-06-14 | 本地迭代收尾：状态、验收、发布记录、功能 README 链接 |
