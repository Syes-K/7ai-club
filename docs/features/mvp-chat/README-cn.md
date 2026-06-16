# mvp-chat — 功能概览

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **Feature slug：** `mvp-chat`  
> **迭代：** [`iter-01`](../../iterations/iter-01/README-cn.md)（已交付）· [`iter-02`](../../iterations/iter-02/README-cn.md)（**本地完成 · 待 migration/手测**）  
> **路线图阶段：** 1 — MVP 聊天

---

## 文档地图（Agent 入口）

**iter-02 必读：**

1. [01-product-requirements-cn.md](./01-product-requirements-cn.md) — 总纲 §2 全局约定  
2. [changelog/iter-02-cn.md](./changelog/iter-02-cn.md) — 本迭代增量与验收  
3. 子 PRD：[landing-cn.md](./prd/landing-cn.md) · [chat-experience-cn.md](./prd/chat-experience-cn.md) · [llm-reliability-cn.md](./prd/llm-reliability-cn.md)

| 类型 | 总纲 | 子文档 |
|------|------|--------|
| 产品 | [01-product-requirements-cn.md](./01-product-requirements-cn.md) | [prd/](./prd/) |
| 技术 | [02-technical-design-cn.md](./02-technical-design-cn.md) | [design/](./design/) |
| 迭代 | — | [changelog/iter-02-cn.md](./changelog/iter-02-cn.md) |

---

## iter-01 已交付

- Next.js App Router：认证、流式聊天 UI、对话历史
- Supabase Auth + RLS + `supabase/migrations/20260614000000_mvp_chat.sql`
- Chat API、`lib/llm/provider.ts` 多提供商
- 详见 [prd/core-chat-cn.md](./prd/core-chat-cn.md)、[design/core-chat-cn.md](./design/core-chat-cn.md)

---

## iter-02（本地完成）

- 营销首页 C2、顶栏用户菜单、Chat 删除/清空/Markdown、百炼加固
- 详见 [changelog/iter-02-cn.md](./changelog/iter-02-cn.md)、[iter-02 README §7](../../iterations/iter-02/README-cn.md)

**iter-02 设计：** [design/landing-cn.md](./design/landing-cn.md) · [chat-experience-cn.md](./design/chat-experience-cn.md) · [llm-reliability-cn.md](./design/llm-reliability-cn.md)

---

## 本地快速开始

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

见根目录 [README.cn.md](../../../README.cn.md)。

---

*文档分层说明：[docs/README-cn.md](../../README-cn.md)*
