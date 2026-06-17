# MVP 聊天 — 技术设计总纲

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文：** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **项目：** 7ai-club  
> **Feature slug：** `mvp-chat`  
> **路线图阶段：** 1 — MVP 聊天  
> **关联 PRD：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)  
> **状态：** iter-01 已确认；iter-02/03/04 **已实现**  
> **技术设计确认日期：** 2026-06-15（iter-02）；iter-04 2026-06-17  
> **文档版本：** v0.5

---

## 1. 概述

技术设计按模块存放在 `design/`。**iter-02 实现前请读：**

1. [changelog/iter-02-cn.md](./changelog/iter-02-cn.md)
2. 下列三份模块设计（必读）

### 1.1 iter-02 模块设计（草稿）

| 模块 | 文档 | PRD |
|------|------|-----|
| Landing + C2 + Header | [design/landing-cn.md](./design/landing-cn.md) | [prd/landing-cn.md](./prd/landing-cn.md) |
| 删除 + Markdown | [design/chat-experience-cn.md](./design/chat-experience-cn.md) | [prd/chat-experience-cn.md](./prd/chat-experience-cn.md) |
| 百炼 + 错误 | [design/llm-reliability-cn.md](./design/llm-reliability-cn.md) | [prd/llm-reliability-cn.md](./prd/llm-reliability-cn.md) |

### 1.2 iter-04 模块设计（已实现）

| 模块 | 文档 | PRD |
|------|------|-----|
| 混合浏览器数据访问 | [design/data-access-cn.md](./design/data-access-cn.md) | [prd/data-access-cn.md](./prd/data-access-cn.md) |

**iter-04 验收：** [changelog/iter-04-cn.md](./changelog/iter-04-cn.md)

### 1.3 全局架构

| 项 | 选择 |
|----|------|
| 编排 | Vercel AI SDK `streamText` + `useChat` |
| 运行时 | `nodejs`；chat `maxDuration` 130s |
| LLM | `lib/llm/provider.ts`；iter-02 chunk 60s + bailian `enable_thinking: false` |
| 数据 | Supabase RLS；删除对话 CASCADE messages |
| 前端 | Next.js App Router、Tailwind、shadcn/ui |
| MD | `react-markdown` + `remark-gfm` + `rehype-sanitize` + `rehype-highlight` |
| 视觉 | C2 tokens → `globals.css` + `design-system/MASTER.md` |

---

## 2. 设计文档地图

| 文档 | 范围 | 状态 |
|------|------|------|
| [design/core-chat-cn.md](./design/core-chat-cn.md) | iter-01 核心 | 已确认 |
| [design/landing-cn.md](./design/landing-cn.md) | Landing、Header、C2 | **已实现** |
| [design/chat-experience-cn.md](./design/chat-experience-cn.md) | DELETE、Clear、MD、侧栏 UX | **已实现** |
| [design/llm-reliability-cn.md](./design/llm-reliability-cn.md) | 超时、百炼、errors | **已实现** |
| [design/data-access-cn.md](./design/data-access-cn.md) | 浏览器分层、RPC、BFF 迁移 | **已实现（iter-04）** |

---

## 3. iter-02 文件变更总览

| 操作 | 路径 | 模块 |
|------|------|------|
| 重写 | `app/page.tsx` | landing |
| 新增 | `components/layout/site-header.tsx` | landing |
| 新增 | `components/landing/*` | landing |
| 修改 | `app/globals.css`, `app/layout.tsx` | landing |
| 新增 | `app/api/conversations/[id]/route.ts` | chat-experience |
| 新增 | `components/chat/markdown-content.tsx` | chat-experience |
| 新增 | `app/api/conversations/[id]/messages/route.ts` | chat-experience |
| 新增 | `components/chat/clear-chat-dialog.tsx` | chat-experience |
| 新增 | `lib/chat/format.ts`, `lib/constants/chat-layout.ts` | chat-experience |
| 修改 | `lib/llm/timeout.ts`, `lib/llm/errors.ts` | llm-reliability |
| 修改 | `app/api/chat/route.ts` | llm-reliability |

完整清单见各模块 `design/*.md` §文件变更。

---

## 4. 实现顺序建议

1. **llm-reliability** — 独立，可先验证百炼
2. **landing** — C2 tokens + 首页 + Header
3. **chat-experience** — 依赖 C2 换肤；DELETE + MD

---

## 5. 修订记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-06-14 | v0.1 | iter-01 单文件 → `design/core-chat` |
| 2026-06-15 | v0.2 | iter-02 三模块设计草稿 |
| 2026-06-16 | v0.3 | iter-02 本地实现完成 |
| 2026-06-16 | v0.4 | iter-04 混合数据访问设计草稿 |
| 2026-06-17 | v0.5 | iter-04 实现完成；design/data-access → 已实现 |

---

*下一迭代编码前请读对应 `changelog/iter-NN`。*
