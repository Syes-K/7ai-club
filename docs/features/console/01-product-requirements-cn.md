# 控制台 — 产品需求总纲

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **项目：** 7ai-club  
> **Feature slug：** `console`  
> **迭代：** `iter-03`（见 [iter-03 README](../../iterations/iter-03/README-cn.md)）  
> **路线图阶段：** 1 — MVP 聊天 + 配置 UI  
> **状态：** 已确认 · **已交付（iter-03）**  
> **PRD 确认日期：** 2026-06-16  
> **文档版本：** v0.2

---

## 1. 执行摘要

为已登录用户提供 **Console（控制台）**：左侧菜单 + 多页面。iter-03 交付 **Profile**（邮箱、nickName、对话模型偏好）、**Assistants**（多助理 CRUD + system prompt）、**New Chat 助理选择器**，以及 Models / 知识库 / MCP 占位页。视觉与首页 **C2 · Electric Ocean** 一致。**用户可见 UI 文案为 English。**

详细需求见子 PRD — [§3 文档地图](#3-文档地图)。

---

## 2. 全局约定

### 2.1 路由

| 路径 | 页面 | 鉴权 |
|------|------|------|
| `/console` | 重定向 → `/console/profile` | 需登录 |
| `/console/profile` | Profile | 需登录 |
| `/console/models` | Model 管理（占位） | 需登录 |
| `/console/assistants` | Assistants | 需登录 |
| `/console/knowledge` | 知识库（占位） | 需登录 |
| `/console/mcp` | MCP（占位） | 需登录 |

### 2.2 导航

- **入口：** 顶栏 **Console** 链接 + UserMenu 菜单项（仅已登录）
- **Console 壳：** 左侧菜单 — Profile → Models → Assistants → Knowledge Base → MCP
- **互链：** Console 顶栏保留 **Chat** 链接

### 2.3 权限

| 操作 | 谁可以 |
|------|--------|
| 访问 `/console/*` | 已登录用户 |
| 编辑个人 Profile | 本人 |
| CRUD 自己的 Assistants | 本人 |
| 删除有绑定对话的助理 | 禁止 |
| 平台模板助理（`user_id` 为空） | UI 不可见；仅服务端 seed |
| LLM API Key | 仅服务端 |

### 2.4 模型解析（聊天）

优先级：**用户 `preferred_model`（Profile）** → env `LLM_MODEL` → 当前提供商默认。iter-03 **不支持**按助理单独选模型。

### 2.5 非目标（全 feature）

知识库上传/RAG、MCP 连接、Model 提供商管理、每助理 model 选择、OAuth、组织/多租户、助理挂载 KB/MCP。

### 2.6 非功能（摘要）

- 渲染：Console 页面可使用客户端组件（CSR 友好）
- 安全：`user_profiles` 与用户 `assistants` 走 RLS；API `getUser()` 门禁
- 语言：用户可见 UI **English**

### 2.7 功能索引

| ID | 功能 | 详细 PRD | 迭代 |
|----|------|----------|------|
| F-20 | Console 壳与占位页 | [prd/placeholders-cn.md](./prd/placeholders-cn.md) | iter-03 |
| F-21 | Profile | [prd/profile-cn.md](./prd/profile-cn.md) | iter-03 |
| F-22 | Assistants CRUD（含 Icon、Opening message） | [prd/assistants-cn.md](./prd/assistants-cn.md) | iter-03 |
| F-23 | New Chat 助理选择 | [prd/chat-assistant-picker-cn.md](./prd/chat-assistant-picker-cn.md) | iter-03 |

---

## 3. 文档地图

| 文档 | 范围 |
|------|------|
| [prd/profile-cn.md](./prd/profile-cn.md) | nickName、模型偏好 |
| [prd/assistants-cn.md](./prd/assistants-cn.md) | 多助理 CRUD |
| [prd/chat-assistant-picker-cn.md](./prd/chat-assistant-picker-cn.md) | 新建对话流程 |
| [prd/placeholders-cn.md](./prd/placeholders-cn.md) | Models、KB、MCP 占位 |
| [changelog/iter-03-cn.md](./changelog/iter-03-cn.md) | iter-03 增量、AC-01–12 |

技术总纲：[02-technical-design-cn.md](./02-technical-design-cn.md)

---

## 4. 修订记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-06-16 | v0.1 | iter-03 初稿 |
| 2026-06-16 | v0.2 | Icon/Opening message；标记 iter-03 已交付 |

---

*概览：[README-cn.md](./README-cn.md)* · *迭代：[iter-03](../../iterations/iter-03/README-cn.md)*
