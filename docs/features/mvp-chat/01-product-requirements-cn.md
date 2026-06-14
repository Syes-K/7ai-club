# MVP 聊天

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **项目：** 7ai-club  
> **Feature slug：** `mvp-chat`  
> **迭代：** `iter-01`（见 [`docs/iterations/iter-01/README-cn.md`](../../iterations/iter-01/README-cn.md)）  
> **路线图阶段：** 1 — MVP 聊天  
> **状态：** 已确认  
> **PRD 确认日期：** 2026-06-14  
> **文档版本：** v0.1

---

## 1. 执行摘要

为已登录用户提供单页流式 AI 聊天体验：固定一个默认助理（无助理管理界面），通过 SiliconFlow（OpenAI 兼容 API）调用 `Qwen/Qwen2.5-7B-Instruct`，对话持久化至 Supabase。用户可邮箱注册/登录、新建对话、查看历史并继续聊天。视觉风格为 Minimal + Professional + Dark；**用户可见 UI 文案为 English**。本功能为路线图阶段 1 的基础交付，后续迭代在此基础上扩展助理配置、知识库与 MCP。

---

## 2. 背景与目标

### 2.1 背景

7ai-club 是聊天优先、可配置 AI 助理的 Web 平台。当前仓库仅有架构调研与开发工作流，尚无应用代码。iter-01 以最小可用聊天闭环验证技术栈（Next.js + Supabase Auth + Vercel AI SDK）与产品核心体验。

### 2.2 目标

- 已登录用户可在浏览器中完成注册、登录，并使用流式 AI 聊天
- 对话与消息持久化，用户可查看历史对话列表并继续聊天
- 用户数据通过 Supabase RLS 隔离，未登录用户无法访问聊天功能
- 为阶段 2（知识库）及阶段 3（Agent）奠定 Auth、数据模型与聊天 API 基础

### 2.3 非目标（Out of Scope）

- 助理 CRUD、自定义系统提示词 UI
- 知识库 / RAG、MCP 工具、Agent 多步推理（ToolLoopAgent）
- 多 LLM 提供商或模型切换 UI
- Magic Link、OAuth 社交登录
- 限流、可观测性、生产级降级（阶段 5）
- 组织/多租户模型

---

## 3. 用户与场景

### 3.1 目标用户

| 角色 | 描述 |
|------|------|
| 新用户 | 首次访问平台，需注册账号后使用聊天 |
| 已登录用户 | 日常使用 AI 聊天，管理多个历史对话 |

### 3.2 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-01 | As a 新用户，I want 用邮箱和密码注册并登录，so that 我可以使用聊天功能 | P0 |
| US-02 | As a 已登录用户，I want 在聊天页发送消息并实时看到 AI 流式回复，so that 对话体验自然流畅 | P0 |
| US-03 | As a 已登录用户，I want 查看历史对话列表并打开继续聊，so that 我可以回顾和延续之前的讨论 | P0 |
| US-04 | As a 已登录用户，I want 新建一个空白对话，so that 我可以开始新话题 | P0 |
| US-05 | As a 已登录用户，I want 登出账号，so that 我可以安全退出 | P1 |

---

## 4. 功能需求

### 4.1 功能列表

| ID | 功能 | 说明 | 优先级 |
|----|------|------|--------|
| F-01 | 用户注册 | 邮箱 + 密码注册，成功后自动登录 | P0 |
| F-02 | 用户登录 | 邮箱 + 密码登录 | P0 |
| F-03 | 用户登出 | 清除 session，跳转登录页 | P1 |
| F-04 | 路由保护 | 未登录访问受保护页面时跳转登录 | P0 |
| F-05 | 流式聊天 | 发送用户消息，AI 以 token 流式返回 | P0 |
| F-06 | 对话持久化 | 用户消息与 AI 回复写入数据库 | P0 |
| F-07 | 历史对话列表 | 侧边栏展示当前用户的对话，按最近活跃排序 | P0 |
| F-08 | 新建对话 | 创建空白对话并切换至该对话 | P0 |
| F-09 | 默认助理 | 固定一个助理，系统提示词由服务端/seed 配置 | P0 |

### 4.2 详细说明

#### F-05：流式聊天

**描述：** 用户在输入框发送消息后，界面实时展示 AI 回复的 token 流，无需等待整段生成完毕。

**交互 / 规则：**

- 发送中禁用重复提交（或显示 loading 状态）
- 新消息追加至当前对话消息列表
- 使用固定默认助理的配置（系统提示词 + 模型 `Qwen/Qwen2.5-7B-Instruct`）
- LLM 调用经 SiliconFlow OpenAI 兼容端点：`https://api.siliconflow.cn/v1`

**边界与异常：**

- LLM API 失败：展示可读错误提示，保留用户已发送的消息
- 空输入：不发送
- 网络中断：提示重试

#### F-07：历史对话列表

**描述：** 聊天页左侧（或等效布局）展示当前用户所有对话，点击切换。

**交互 / 规则：**

- 每条对话显示标题（首条用户消息摘要或「New Chat」）
- 按 `updated_at` 降序排列
- 切换对话时加载对应消息历史

**边界与异常：**

- 无历史对话：显示空态，引导用户发送首条消息或新建对话

#### F-09：默认助理

**描述：** MVP 不提供助理管理 UI；所有用户使用同一个预置助理。

**交互 / 规则：**

- 助理在数据库 seed 或服务端常量中配置
- 字段至少包含：`name`、`system_prompt`、`model`（`Qwen/Qwen2.5-7B-Instruct`）
- 新对话自动关联该默认助理

---

## 5. 页面与交互

### 5.1 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 重定向 | 已登录 → `/chat`；未登录 → `/login` |
| `/login` | 登录页 | 邮箱 + 密码 |
| `/register` | 注册页 | 邮箱 + 密码 |
| `/chat` | 聊天页 | 侧边栏历史 + 消息区 + 输入框 |
| `/chat/[conversationId]` | 聊天页（指定对话） | 可选：URL 携带当前对话 ID |

### 5.2 关键 UI 状态

- **默认态：** 当前对话消息列表 + 可用输入框
- **加载态：** 发送消息或切换对话时显示 skeleton / spinner
- **流式态：** AI 回复逐字/逐 token 追加显示
- **空态：** 新对话无消息时，展示简短引导文案
- **错误态：** LLM 或网络错误时，消息区或 toast 展示错误信息

### 5.3 视觉与品牌

- **调性：** Minimal、Professional、Dark
- **实现：** 由 fullstack-developer 在技术设计中引用 `ui-ux-pro-max` skill 产出 `design-system/MASTER.md`

---

## 6. 权限与安全（产品层）

| 操作 | 谁可以 | 备注 |
|------|--------|------|
| 注册 / 登录 | 任何人 | 公开页面 |
| 发送聊天消息 | 已登录用户 | JWT 校验 |
| 查看对话列表 | 对话所有者 | RLS：`user_id = auth.uid()` |
| 查看 / 继续对话 | 对话所有者 | 同上 |
| 访问 LLM API Key | 仅服务端 | 不暴露给浏览器 |

---

## 7. 非功能需求

| 类型 | 要求 |
|------|------|
| 性能 | 首 token 延迟在正常网络下可感知为「实时流式」（< 3s 目标，依赖 SiliconFlow） |
| 安全 | Supabase Auth JWT + RLS；`SILICONFLOW_API_KEY` 仅服务端环境变量 |
| 可用性 | 移动端基本可用（响应式布局）；Dark 主题为主 |
| 部署 | Vercel；Chat Route `maxDuration` 按 Hobby 计划 300s 配置 |

---

## 8. 验收标准

- [ ] **AC-01**：未登录访问 `/chat` 跳转至 `/login`
- [ ] **AC-02**：邮箱注册成功后自动登录并进入 `/chat`
- [ ] **AC-03**：已登录用户发送消息后，AI 回复以 token 流式显示
- [ ] **AC-04**：刷新页面后，当前对话消息仍可正确加载
- [ ] **AC-05**：侧边栏展示当前用户历史对话列表，点击可切换
- [ ] **AC-06**：可新建空白对话，新对话初始为空态
- [ ] **AC-07**：LLM 调用失败时，界面展示可读错误提示（非白屏）
- [ ] **AC-08**：用户 A 无法看到用户 B 的对话（RLS 隔离验证）
- [ ] **AC-09**：AI 回复使用模型 `Qwen/Qwen2.5-7B-Instruct`（经 SiliconFlow 端点）

---

## 9. 依赖与假设

### 9.1 依赖

- Supabase 项目（Auth + PostgreSQL）
- SiliconFlow API 账号与 API Key
- Vercel 部署环境（或本地 `next dev` 开发）
- Next.js App Router、Vercel AI SDK、`@supabase/ssr`

### 9.2 假设

- 用户可正常访问 `api.siliconflow.cn`
- MVP 单用户 workspace，无组织模型
- 默认助理系统提示词由开发者在 seed/配置中设定，用户不可编辑
- 对话标题可由首条用户消息自动截取生成

---

## 10. 开放问题

| ID | 问题 | 状态 | 决议 |
|----|------|------|------|
| OQ-01 | LLM 提供商 | 已决 | SiliconFlow（OpenAI 兼容，`https://api.siliconflow.cn/v1`） |
| OQ-02 | 默认模型 | 已决 | `Qwen/Qwen2.5-7B-Instruct` |
| OQ-03 | 多租户模型 | 已决 | 单用户 workspace |
| OQ-04 | 默认助理系统提示词文案 | 已决 | English：`You are the AI assistant for 7ai-club. Answer clearly and concisely. Match the language the user writes in.` |

---

## 11. 修订记录

| 日期 | 版本 | 迭代 | 变更 |
|------|------|------|------|
| 2026-06-14 | v0.1 | iter-01 | 初稿（极简聊天 + SiliconFlow + Qwen2.5-7B） |

---

*迭代索引：[`docs/iterations/iter-01/README-cn.md`](../../iterations/iter-01/README-cn.md)*  
*下一文档：[`02-technical-design-cn.md`](./02-technical-design-cn.md)（由 fullstack-developer 产出）*
