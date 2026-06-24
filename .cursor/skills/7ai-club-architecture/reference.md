# 7ai-club 架构决策手册

> 提炼自 `docs/research/ai-agent-platform-architecture-cn.md`。完整论证与方案 A 对比见原文。

## 定位

聊天优先、可配置 AI 助理的 Web 平台（7ai-club）。

## 技术栈（已决）

| 层 | 选择 |
|----|------|
| 前端 | Next.js App Router + Tailwind（首页、聊天 UI） |
| 后台 UI | shadcn/ui |
| 面向用户 UI | `ui-ux-pro-max` skill → `design-system/MASTER.md` + 页面 override |
| 数据 | Supabase（Auth、PostgreSQL、pgvector、Storage） |
| 鉴权 | **Supabase Auth JWT** + `@supabase/ssr`（见下「JWT 鉴权」） |
| 部署 | Vercel |
| 编排 | **方案 B** — Vercel AI SDK + Node 层（**MVP 不用 n8n**） |

## 架构决策：方案 B

**推荐方案 B**（Vercel AI SDK 编排），理由：

- 聊天优先产品，低延迟、完整 token 流式
- 单部署（Vercel），运维简单
- 按助理动态组装配置，TypeScript 端到端类型安全

**何时再考虑 n8n / Inngest：**

- 复杂多系统集成自动化（CRM、定时报告、审批流）
- 非技术团队需不改代码调整流程
- 集成超出自定义 tool 合理范围

**混合模式（未来）：** 聊天 + RAG + MCP → AI SDK；复杂后台自动化 → Inngest 或 n8n。

## 产品能力域

| # | 能力 | 要点 |
|---|------|------|
| 1 | AI 聊天 | 实时、流式 |
| 2 | 助理配置 | 每助理独立设置 |
| 2a | 知识库 | 助理绑定一个或多个 KB |
| 2b | MCP | 助理连接已配置 MCP 服务 |
| 2c | 系统提示词 | 每助理自定义 |
| 3–7 | 基础设施 | Supabase、Next.js 前端、shadcn 后台、Vercel 部署 |

## 建议代码结构

```
app/
  api/chat/route.ts           # JWT 鉴权、加载配置、流式响应
  (pages)/                    # 首页、聊天 UI
  admin/                      # shadcn/ui 后台

middleware.ts                 # 刷新 JWT session、保护路由

lib/
  supabase/
    client.ts                 # 浏览器 Client（anon key）
    server.ts                 # Server Component / Route Handler
    middleware.ts             # middleware 用 createServerClient
  agents/assistant-agent.ts   # ToolLoopAgent
  tools/rag.ts
  tools/supabase.ts
  mcp/connect.ts
```

## 核心数据模型（概念）

```
assistants, knowledge_bases, assistant_knowledge_bases,
assistant_mcp_servers, conversations, messages
```

助理配置字段：`system_prompt`、`knowledge_base_ids`、`mcp_servers`、`model`。

## Chat Route 流程

```typescript
export const runtime = 'nodejs';
export const maxDuration = 300; // Hobby 上限 300；Pro 可更高

// 1. JWT 鉴权（supabase.auth.getUser()）
// 2. 加载助理配置（system_prompt、kb_ids、mcp_servers）
// 3. 加载对话历史
// 4. 组装 tools（RAG + MCP + 自定义）
// 5. ToolLoopAgent.stream({ messages })
// 6. 流式返回；完成后持久化 assistant 消息
```

## 工程约束（必须遵守）

### Serverless 超时

| 计划 | maxDuration |
|------|-------------|
| Hobby | 300s |
| Pro | 800s |

- 限制 `maxSteps`（5–8）
- 所有上游 `fetch` 设超时
- 鉴权、配置、RAG 尽量并行
- 极复杂流程 → Inngest / Trigger.dev

多步 Agent 单轮可能 28s+，流式不能避免超时切断。

### MCP

- **仅 HTTP/SSE**；stdio 在 Serverless 不可用
- 按请求 `createMCPClient` → 合并 tools → 请求结束关闭
- 凭证 Supabase 加密存储，运行时解密
- MVP 建议限制任意用户 URL；常用集成走 MCP Gateway

### RAG / 知识库

| 任务 | 执行位置 |
|------|----------|
| 聊天 + 在线检索 | Vercel Route Handler（1–3s） |
| 上传、分块、批量 Embedding | **后台任务**（不在 chat route） |

流水线：上传 → 分块 → Embedding → pgvector → 提问时 Top-K → 注入上下文。

### JWT 鉴权（已决）

采用 **Supabase Auth 签发 JWT**，不自建独立 JWT 服务（MVP）。

| 项 | 选择 |
|----|------|
| 身份提供商 | Supabase Auth（邮箱/密码；OAuth 按需扩展） |
| Token 形态 | **Access JWT**（短期）+ **Refresh Token**（轮换） |
| Next.js 集成 | `@supabase/ssr`（App Router） |
| 客户端传递 | Cookie（SSR 默认）或 `Authorization: Bearer <access_token>` |
| 服务端校验 | `supabase.auth.getUser()` — 验签 + 过期，**禁止**仅客户端 decode |
| 数据层 | RLS：`auth.uid()` 与 JWT `sub` 对齐 |
| 服务端特权 | `service_role` 仅服务端环境变量，**永不**暴露给浏览器 |

**请求流：**

```
登录/注册 → Supabase 返回 access JWT + refresh
         → @supabase/ssr 写入 Cookie（或客户端持 Bearer）
         → middleware 刷新即将过期的 session
         → Route Handler：createServerClient → getUser()
         → 401 未登录 / 403 无权限；通过则用 user.id 查数据
         → Postgres RLS 按 auth.uid() 过滤
```

**Route Handler 概念：**

```typescript
const supabase = await createClient(); // lib/supabase/server.ts
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) return new Response('Unauthorized', { status: 401 });
// 后续用 user.id，查询走 RLS 保护的 client（非 service_role）
```

**安全要点：**

- 不在客户端存储 `service_role`；LLM / MCP 密钥仅服务端
- Chat API、`/api/*` 业务路由均须 `getUser()` 门禁
- Admin 路由：middleware 或 layout 校验登录态
- JWT 泄露：短 access 有效期 + HttpOnly Cookie（SSR 路径）；生产 HTTPS only
- **MVP 不做** 自签 JWT + 自建用户表替代 Supabase Auth

### 安全（其他）
- MCP 凭证加密（Vault 或应用层）
- LLM API Key 仅服务端环境变量
- 输入校验、限流（阶段 5）

### 其他 Serverless 注意

- 冷启动：精简依赖、Fluid Compute
- 无跨请求内存：对话历史持久化 Supabase
- 连接池：Supabase JS client / Supavisor
- MCP、PDF 等用 `runtime = 'nodejs'`（非 Edge）

## Vercel AI SDK 能力（2026）

| 功能 | API |
|------|-----|
| 流式聊天 | `streamText`、`useChat` |
| Agent 循环 | `ToolLoopAgent` |
| MCP | `@ai-sdk/mcp`、`createMCPClient` |
| UI 流式 | `createUIMessageStream` |

## 实施路线图

| 阶段 | 内容 |
|------|------|
| **1 — MVP 聊天** | 脚手架、**Supabase Auth JWT** + `@supabase/ssr`、middleware、基础表、助理 CRUD、`streamText` + `useChat`、`maxDuration` |
| **2 — 知识库** | pgvector、文档上传、后台入库、RAG tool、助理↔KB 绑定 |
| **3 — Agent** | `ToolLoopAgent`、自定义 tools、对话记忆、可观测性 |
| **4 — MCP** | `@ai-sdk/mcp`、后台绑定、凭证加密、Gateway（可选） |
| **5 — 生产** | 限流、RLS 审计、降级、成本监控 |

PRD / 技术设计须标明功能所属阶段。

## Locale & user-facing copy（已决）

| 范围 | 语言 | 说明 |
|------|------|------|
| 用户可见 UI | **English** | 页面文案、按钮、空态/错误提示、`aria-label` |
| DB seed / 默认值 | **English** | 如 `assistants.name`、`system_prompt`、对话默认 title |
| **`docs/` 项目文档** | **English + 中文（成对）** | 与 `docs/research/` 相同：`*.md` + `*-cn.md`；见 `docs/README.md` |
| Cursor rules / skills / Agent 回复 | 中文为主 | 与用户协作；术语可保留英文 |
| i18n（产品多语言） | 暂不做 | 需要时再引入 `next-intl` 等 |

**编码约束：**

- `app/`、`components/` 中面向用户的字符串使用英文
- 新增 Supabase migration 的 seed / default 与用户可见枚举值使用英文
- 默认助理 system prompt 使用英文；模型按用户输入语言回复（见 seed 文案）
- `html lang="en"`（`app/layout.tsx`）

## 配置 vs 编排边界

| Supabase（应用管理） | 代码编排（AI SDK） |
|---------------------|-------------------|
| 系统提示词 | Agent 推理逻辑 |
| 知识库绑定 | RAG 检索步骤 |
| MCP 服务列表 | 工具调用顺序 |
| 模型选择 | 多步 Agent 协作 |
| 用户 / 权限（JWT + RLS） | 外部 API 集成 |

原则：业务配置在 Supabase；流程逻辑在代码。不在节点/路由中硬编码提示词。

## Loading UX（已决）

新增用户可见异步操作前必读 **[docs/loading-ux-cn.md](../../../docs/loading-ux-cn.md)**（英文：[loading-ux.md](../../../docs/loading-ux.md)）。

| 区域 | 要点 |
|------|------|
| Console 列表 mutation | `ConsolePage` + `usePageBusy` — 禁止仅按钮 loading |
| Console 多 Card 保存 | `ConsoleSection` 区块 busy |
| RSC 首屏 | `app/.../loading.tsx` + `ConsolePageLoading` |
| Chat 切换/删除 | `ChatNavigationFeedback` + `deletingId` / `pendingId` |
| Chat 侧栏首屏 | `listLoading`，不闪空态 |
| 文案 | 用户可见 loading 为 **English**（`Saving…`、`Loading models…`） |

Console 组件索引：`docs/features/console/design/console-shell-cn.md` §8。Chat 索引：`chat-integration-cn.md` §6。

## 待决问题（PRD 相关功能须对焦）

1. LLM 提供商：OpenAI / Anthropic / 多提供商？
2. Embedding：`text-embedding-3-small` 或开源？
3. MCP MVP：用户自定义 URL 还是精选列表？
4. 多租户：单用户 workspace 还是组织模型？
5. 后台任务：Inngest / Trigger.dev / Supabase Edge Functions？
6. 可观测性：Langfuse / Axiom / Vercel 日志？

## 方案 A（n8n）— 仅作背景，MVP 不采用

- n8n 无法部署在 Vercel，需独立托管（双系统运维）
- 多一跳 Webhook，流式体验受限（中间步骤不流式）
- 动态 MCP 需变通（Webhook payload + 表达式）
- 适合通用自动化平台，非本 MVP 首选

## 开发工具 MCP（Cursor IDE，非产品运行时 MCP）

在 Cursor 中推荐启用（项目 `.cursor/mcp.json` 或全局 `~/.cursor/mcp.json`）：

| MCP | 用途 |
|-----|------|
| **Supabase** | 表结构、`execute_sql`（read_only）、迁移、`generate_typescript_types`、文档搜索 |
| **Context7** | Vercel AI SDK、Next.js、`@supabase/ssr` 最新文档 |
| **Playwright** | 登录、聊天 UI、鉴权 E2E |

Supabase MCP URL 建议：`read_only=true` + `project_ref` 限定项目；创建 Supabase 项目后把 ref 写入 `.cursor/mcp.json`。OAuth 在 Cursor MCP 设置中完成，无需 PAT 写入仓库。


- [Vercel AI SDK — Agents](https://ai-sdk.dev/docs/agents/overview)
- [Vercel AI SDK — MCP](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools)
- [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Supabase Auth — JWTs](https://supabase.com/docs/guides/auth/jwts)
- [Supabase — Server-Side Auth Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
