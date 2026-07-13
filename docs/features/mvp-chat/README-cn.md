# mvp-chat — 功能概览

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **Feature slug：** `mvp-chat`  
> **迭代：** [`iter-01`](../../iterations/iter-01/README-cn.md)（已交付）… [`iter-10`](../../iterations/iter-10/README-cn.md)（**已发布**）· [`iter-12`](../../iterations/iter-12/README-cn.md)（admin 交叉修订 · 进行中）  
> **路线图阶段：** 1 — MVP 聊天

---

## 文档地图（Agent 入口）

**iter-12（admin 交叉修订 · 进行中）：**

1. [changelog/iter-12-cn.md](./changelog/iter-12-cn.md) — Chat 模型解析 / 对话创建
2. [admin/changelog/iter-12-cn.md](../admin/changelog/iter-12-cn.md) — **主验收 AC-120–141**
3. [console/changelog/iter-12-cn.md](../console/changelog/iter-12-cn.md) — 选择器聚合列表

**iter-04（已交付）：**

1. [changelog/iter-04-cn.md](./changelog/iter-04-cn.md) — 混合数据访问增量与验收  
2. [design/data-access-cn.md](./design/data-access-cn.md) — 浏览器分层与 BFF 迁移  
3. [prd/data-access-cn.md](./prd/data-access-cn.md) — 无 UI 变更的产品范围

| 类型 | 总纲 | 子文档 |
|------|------|--------|
| 产品 | [01-product-requirements-cn.md](./01-product-requirements-cn.md) | [prd/](./prd/) |
| 技术 | [02-technical-design-cn.md](./02-technical-design-cn.md) | [design/](./design/) |
| 迭代 | — | [changelog/iter-04-cn.md](./changelog/iter-04-cn.md) |

---

## iter-01 已交付

- Next.js App Router：认证、流式聊天 UI、对话历史
- Supabase Auth + RLS + `supabase/migrations/20260614000000_mvp_chat.sql`
- Chat API、`lib/llm/provider.ts` 多提供商
- 详见 [prd/core-chat-cn.md](./prd/core-chat-cn.md)、[design/core-chat-cn.md](./design/core-chat-cn.md)

---

## iter-02（已交付）

- 营销首页 C2、顶栏用户菜单、Chat 删除/清空/Markdown、百炼加固
- 详见 [changelog/iter-02-cn.md](./changelog/iter-02-cn.md)

## iter-03（Console + Chat 集成 — 已交付）

- Console 侧栏、Profile、Assistants CRUD（Icon/Opening）、New Chat 必选助理
- ChatAppShell 客户端 session、导航修复
- 详见 [console README-cn.md](../console/README-cn.md)、[iter-03 changelog §2](../console/changelog/iter-03-cn.md)

## iter-04（已交付）

- CRUD 迁浏览器 Supabase；`app/api/` 仅余 `POST /api/chat`
- 详见 [iter-04 README-cn.md](../../iterations/iter-04/README-cn.md)、[changelog/iter-04-cn.md](./changelog/iter-04-cn.md)

## iter-12（admin 交叉修订 · 进行中）

- Chat 平台模型 Key 改 DB 解密；废弃 `BAILIAN_API_KEY`
- New Chat 系统助理 + 聚合列表（见 console changelog）
- 详见 [changelog/iter-12-cn.md](./changelog/iter-12-cn.md)、[prd/chat-model-config-cn.md](./prd/chat-model-config-cn.md)

## iter-10（已发布 — 发布后 UX）

- Landing 纵向布局、Header 精简、能力区 6 项
- 助手选择 **Manage assistants**；Auth `?next=` 保留
- 详见 [iter-10 README-cn.md](../../iterations/iter-10/README-cn.md)、[changelog/iter-10-cn.md](./changelog/iter-10-cn.md)

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
