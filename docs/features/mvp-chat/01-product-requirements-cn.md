# MVP 聊天 — 产品需求总纲

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **项目：** 7ai-club  
> **Feature slug：** `mvp-chat`  
> **路线图阶段：** 1 — MVP 聊天  
> **状态：** 已确认  
> **PRD 确认日期：** 2026-06-15  
> **文档版本：** v0.3（分层结构）

---

## 1. 执行摘要

7ai-club 阶段 1 的聊天能力：邮箱认证、流式对话、历史持久化（Supabase RLS）、多 LLM 提供商（env）。iter-02 增加营销首页、Chat 体验升级（删除、Markdown、顶栏用户）与 C2 视觉统一。**用户可见 UI 文案为 English**。

详细需求按子能力拆分，见 [§3 文档地图](#3-文档地图)。**Agent / 开发请按当前迭代只读相关子文档 + [iter-02 变更摘要](./changelog/iter-02-cn.md)。**

---

## 2. 全局约定（跨子文档有效）

### 2.1 路由

| 路径 | 页面 | 鉴权 |
|------|------|------|
| `/` | 营销首页 | 公开 |
| `/login` | 登录 | 公开 |
| `/register` | 注册 | 公开 |
| `/chat` | 聊天入口 | 需登录 |
| `/chat/[conversationId]` | 指定对话 | 需登录 |

### 2.2 权限（产品层）

| 操作 | 谁可以 |
|------|--------|
| 查看 `/` | 任何人 |
| 聊天 / 查看对话 | 已登录用户（RLS） |
| 删除对话 | 对话所有者 |
| LLM API Key | 仅服务端 |

### 2.3 非目标（全 feature）

助理 CRUD UI、知识库/RAG、MCP、应用内模型切换、OAuth、对话软删除、Console 页面（iter-02）。

### 2.4 非功能（摘要）

- 性能：首 token 目标 < 3s；MD 不阻塞流式
- 安全：RLS、MD sanitize、删除确认
- 部署：Vercel；chat `maxDuration` 130s；`LLM_TIMEOUT_MS` 120000
- 语言：用户可见 UI **English**

### 2.5 功能索引

| ID | 功能 | 详细 PRD | 迭代 |
|----|------|----------|------|
| F-01–F-08 | 认证、流式、历史、新建 | [prd/core-chat-cn.md](./prd/core-chat-cn.md) | iter-01 |
| F-09 | 默认助理 / system_prompt | [prd/chat-experience-cn.md](./prd/chat-experience-cn.md) | iter-02 修订 |
| F-10–F-11 | 首页、顶栏、视觉 C2 | [prd/landing-cn.md](./prd/landing-cn.md) | iter-02 |
| F-12–F-13 | 删除、Markdown | [prd/chat-experience-cn.md](./prd/chat-experience-cn.md) | iter-02 |
| F-14–F-15 | 多提供商、百炼稳定 | [prd/llm-reliability-cn.md](./prd/llm-reliability-cn.md) | iter-01/02 |
| F-30 | 混合数据访问（无 UI 变更） | [prd/data-access-cn.md](./prd/data-access-cn.md) | iter-04 |

---

## 3. 文档地图

### 3.1 产品（`prd/`）

| 文档 | 范围 | 迭代 |
|------|------|------|
| [prd/core-chat-cn.md](./prd/core-chat-cn.md) | 注册登录、流式聊天、持久化、侧边栏 | iter-01 |
| [prd/landing-cn.md](./prd/landing-cn.md) | Landing、Start chat、顶栏用户、C2 视觉 | iter-02 |
| [prd/chat-experience-cn.md](./prd/chat-experience-cn.md) | 删除对话、MD 渲染、system_prompt | iter-02 |
| [prd/llm-reliability-cn.md](./prd/llm-reliability-cn.md) | 多提供商、abort、错误提示 | iter-01/02 |
| [prd/data-access-cn.md](./prd/data-access-cn.md) | 浏览器 CRUD、BFF 收敛 | iter-04 |

### 3.2 迭代变更（`changelog/`）

| 文档 | 说明 |
|------|------|
| [changelog/iter-02-cn.md](./changelog/iter-02-cn.md) | iter-02 增量、验收 AC-10~20 |
| [changelog/iter-04-cn.md](./changelog/iter-04-cn.md) | iter-04 混合数据访问、AC-30~34 |

### 3.3 技术设计

总纲：[02-technical-design-cn.md](./02-technical-design-cn.md) · iter-01 实现细节：[design/core-chat-cn.md](./design/core-chat-cn.md)

---

## 4. 验收标准索引

| 范围 | 文档 |
|------|------|
| AC-01 – AC-08（iter-01，已验收） | [prd/core-chat-cn.md](./prd/core-chat-cn.md) |
| AC-09（多提供商，已替代 AC-09 v0.1） | [prd/llm-reliability-cn.md](./prd/llm-reliability-cn.md) |
| AC-10 – AC-20（iter-02） | 各子 PRD + [changelog/iter-02-cn.md](./changelog/iter-02-cn.md) |
| AC-30 – AC-34（iter-04） | [prd/data-access-cn.md](./prd/data-access-cn.md) + [changelog/iter-04-cn.md](./changelog/iter-04-cn.md) |

---

## 5. 开放问题（全局）

| ID | 决议 |
|----|------|
| OQ-03 | 视觉：Retro Cyber **C2 Electric Ocean** → [landing-cn.md](./prd/landing-cn.md) |
| OQ-04 | 首页：所有人看 Landing，不 auto-redirect |
| OQ-05 – OQ-07 | 删除 / MD / 流式 MD → [chat-experience-cn.md](./prd/chat-experience-cn.md) |

---

## 6. 修订记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-06-14 | v0.1 | iter-01 单文件 PRD |
| 2026-06-15 | v0.2 | iter-02 增量写入单文件 |
| 2026-06-15 | v0.3 | **分层重构**：总纲 + `prd/` + `changelog/` |

---

*功能概览：[README-cn.md](./README-cn.md)* · *迭代：[iter-02](../../iterations/iter-02/README-cn.md)*
