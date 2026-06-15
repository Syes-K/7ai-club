# mvp-chat — 功能概览

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **Feature slug：** `mvp-chat`  
> **迭代：** [`iter-01`](../../iterations/iter-01/README-cn.md)  
> **路线图阶段：** 1 — MVP 聊天  
> **状态：** 本地迭代完成 · 生产部署进行中

---

## 文档

| 类型 | English | 中文 |
|------|---------|------|
| PRD | [01-product-requirements.md](./01-product-requirements.md) | [01-product-requirements-cn.md](./01-product-requirements-cn.md) |
| 技术设计 | [02-technical-design.md](./02-technical-design.md) | [02-technical-design-cn.md](./02-technical-design-cn.md) |

---

## iter-01 已交付

- Next.js App Router：认证、流式聊天 UI、对话历史
- Supabase Auth + RLS + 迁移 `supabase/migrations/20260614000000_mvp_chat.sql`
- Chat API `POST /api/chat`（Vercel AI SDK `streamText` + `useChat`）
- 可切换 LLM 提供商（`lib/llm/provider.ts`）：
  - `siliconflow` — OpenAI 兼容
  - `nvidia` — NVIDIA NIM（`@ai-sdk/openai-compatible`）
  - `bailian` — 阿里百炼 / DashScope（默认模型 `qwen3.6-plus`）
- LLM 超时（默认 120s）+ Vercel 函数 `maxDuration` 130s
- 英文 UI + 英文 DB seed 文案

---

## 实现说明（相对 PRD v0.1 的扩展）

| 主题 | PRD（v0.1） | 实际实现 |
|------|-------------|----------|
| LLM 提供商 | 仅 SiliconFlow | 环境变量切换：SiliconFlow / NVIDIA / Bailian |
| 默认模型 | `Qwen/Qwen2.5-7B-Instruct` | 按 provider 默认值；`LLM_MODEL` 可覆盖 |
| 超时 | `maxDuration = 300` | `maxDuration = 130`，`LLM_TIMEOUT_MS = 120000` |

扩展记录见 [iter-01 发布记录](../../iterations/iter-01/README-cn.md#6-发布记录)。若产品范围正式扩大，再修订 PRD。

---

## 本地快速开始

```bash
pnpm install
cp .env.example .env.local   # Supabase + LLM 密钥
# 在 Supabase 项目执行 supabase/migrations/20260614000000_mvp_chat.sql
pnpm dev
```

完整环境变量见根目录 [README.cn.md](../../../README.cn.md)。

---

## 已知缺口（本地迭代之后）

- Vercel 生产：NVIDIA NIM 可能挂起或超时；部署建议优先 `bailian` 或 `siliconflow`
- PRD AC-09（固定 Qwen 模型）已被多提供商设计替代
- 助理 CRUD、RAG、MCP — iter-01 范围外

---

*迭代索引：[docs/iterations/iter-01/README-cn.md](../../iterations/iter-01/README-cn.md)*
