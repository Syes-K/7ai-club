# AI Agent Web 平台 — 技术调研与架构分析

> **项目：** 7ai-club  
> **日期：** 2026 年 6 月  
> **状态：** 调研 / 实施前

---

## 目录

1. [执行摘要](#执行摘要)
2. [产品需求](#产品需求)
3. [架构方案 A：n8n 编排](#架构方案-an8n-编排)
4. [架构方案 B：Node 层编排（Vercel）](#架构方案-bnode-层编排vercel)
5. [对比分析](#对比分析)
6. [推荐方案](#推荐方案)
7. [实施路线图](#实施路线图)
8. [待决问题](#待决问题)

---

## 执行摘要

本文档评估构建 AI Agent Web 平台的两种架构方案，技术栈如下：

- **前端：** Next.js + Tailwind CSS（首页、聊天 UI）
- **后台管理：** shadcn/ui
- **数据库：** Supabase（Auth、PostgreSQL、pgvector）
- **部署：** Vercel（Next.js 应用）

**核心结论：** 两种方案均可行，但在部署拓扑、运维复杂度和实时聊天适配性上差异显著。

| 方案 | 结论 |
|------|------|
| **方案 A — n8n 编排** | 可行，但 n8n **无法**部署在 Vercel 上，需独立托管 |
| **方案 B — Node 层编排（Vercel AI SDK）** | **推荐**用于聊天优先的产品；延迟更低、部署更简单、流式体验更好 |

两种方案共同面临的主要工程挑战：

1. 按助理动态配置 MCP（多租户）
2. 知识库 RAG 流水线（在线检索 vs 离线索引）
3. Serverless 环境下多步 Agent 循环的超时限制
4. 安全（Webhook 鉴权、MCP 凭证、RLS）

---

## 产品需求

| # | 需求 | 说明 |
|---|------|------|
| 1 | AI 聊天 | 实时、流式响应 |
| 2 | AI 助理配置 | 每个助理独立设置 |
| 2a | 知识库选择 | 助理可绑定一个或多个知识库 |
| 2b | MCP 服务选择 | 助理可连接已配置的 MCP 服务 |
| 2c | 系统提示词 | 每个助理自定义指令 |
| 3 | 数据库 | Supabase |
| 4 | 前端 | Next.js + Tailwind（首页 + 聊天页） |
| 5 | 后台 UI | shadcn/ui |
| 6 | 对话流程编排 | 最初考虑 n8n |
| 7 | 部署 | Vercel |

---

## 架构方案 A：n8n 编排

### 概览

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel                                                      │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │ Next.js 前端     │    │ Next.js API Routes           │   │
│  │ (Tailwind)       │    │ 鉴权 / 助理 CRUD             │   │
│  │ shadcn/ui 后台   │    │                              │   │
│  └────────┬─────────┘    └──────────────┬───────────────┘   │
└───────────┼─────────────────────────────┼───────────────────┘
            │ SSE / Webhook               │ CRUD
            ▼                             ▼
┌───────────────────────┐       ┌─────────────────────────────┐
│ n8n（独立部署）        │       │ Supabase                    │
│ - Webhook Trigger     │       │ - Auth                      │
│ - AI Agent Node       │◄─────►│ - PostgreSQL                │
│ - MCP Client Tool     │       │ - pgvector（知识库）         │
│ - Vector Store Tool   │       │ - Storage（文档）            │
└───────────────────────┘       └─────────────────────────────┘
```

### 可行性评估

| 组件 | 是否可行 | 说明 |
|------|----------|------|
| 通过 n8n 实现 AI 聊天 | ✅ 可行 | n8n 1.106+ 支持 Chat Trigger / Webhook 流式响应 |
| Supabase 存储助理配置 | ✅ 可行 | 通过 Webhook payload 传给 n8n |
| 知识库 / RAG | ⚠️ 中等 | Vector Store Tool 或 HTTP 调用 Supabase RPC |
| MCP 集成 | ⚠️ 中等 | MCP Client Tool（n8n 1.88+）；仅支持 HTTP/SSE |
| Next.js + Tailwind + shadcn/ui | ✅ 可行 | 标准技术栈 |
| 全部部署在 Vercel | ❌ 不可行 | n8n 需要常驻进程和持久化存储 |

### n8n 部署选项

n8n **必须**与 Vercel 分开部署：

| 方案 | 优点 | 缺点 |
|------|------|------|
| n8n Cloud | 托管服务，运维成本低 | 费用较高，定制受限 |
| Railway / Render / Fly.io | 相对简单 | 需自行维护 |
| VPS（Docker） | 完全可控 | 运维负担高 |

### 助理配置如何工作

配置存储在 Supabase，请求时动态传给 n8n：

```json
{
  "assistant_id": "uuid",
  "system_prompt": "...",
  "knowledge_base_ids": ["kb1", "kb2"],
  "mcp_servers": [{ "url": "...", "token": "..." }],
  "message": "用户消息",
  "conversation_id": "uuid"
}
```

使用 n8n 表达式（如 `{{ $json.system_prompt }}`）在运行时注入值 — **不要**为每个助理单独创建一条 workflow。

### 建议的 Supabase 表结构（概念设计）

```sql
assistants              (id, user_id, name, system_prompt, model, ...)
knowledge_bases         (id, name, embedding_model, ...)
assistant_knowledge_bases (assistant_id, kb_id)
assistant_mcp_servers   (assistant_id, mcp_url, auth_config_encrypted, ...)
conversations           (id, assistant_id, user_id, ...)
messages                (id, conversation_id, role, content, ...)
```

### n8n 能力（2026）

- **AI Agent 节点：** 基于 LangChain 的 Agent，支持工具、记忆、流式输出
- **流式响应：** Chat Trigger 或 Webhook 设置 `Response Mode: Streaming`；AI Agent 开启 streaming
- **MCP Client Tool：** 将 AI Agent 连接至外部 MCP 服务（SSE / Streamable HTTP）
- **MCP Server Trigger：** 将 n8n workflow 暴露为 MCP 工具供外部客户端调用
- **Vector Store Tool：** 在 Agent workflow 内做 RAG 检索
- **Workflow Tool：** 将任意 n8n workflow 封装为 Agent 工具

### 主要难点（方案 A）

#### 1. 部署分离 — n8n 无法运行在 Vercel

Vercel 是 Serverless 架构（函数短暂运行，无持久进程）。n8n 需要：

- 长期运行的 Node.js 进程
- 持久化数据库（SQLite / PostgreSQL）
- SSE 长连接

**影响：** 需要部署、监控和保护两套系统。

#### 2. 每个助理动态配置 MCP

n8n 的 MCP Client Tool 节点在 workflow 设计时相对静态。当每个用户为助理配置不同的 MCP 服务时：

- 无法为每个助理创建一条 workflow
- 必须通过 Webhook 传递 MCP 配置，并使用动态连接模式

**缓解方案：**

1. Next.js MCP 代理层（更灵活）
2. 预建 n8n 子 workflow + 按 MCP 类型使用 Workflow Tool
3. 统一 MCP Gateway，按权限过滤工具

#### 3. 流式响应限制

- LLM 最终输出可以流式返回；中间步骤（工具调用、推理过程）通常**不会**流式传给客户端
- `Respond to Chat` 节点会终结当前轮次 — 流式输出无法穿过链中间的该节点
- 顺序多 Agent workflow 无法产生统一的流式「思考过程」输出

#### 4. 知识库 RAG

完整流水线：

```
上传 → 分块 → Embedding → 存入 pgvector
                              ↓
用户提问 → Top-K 检索 → 注入上下文 → LLM 生成
```

挑战：Embedding 模型选择、分块策略、按 `kb_id` 过滤元数据、文档异步处理。

#### 5. 延迟与超时

每条聊天消息路径：前端 → Next.js → n8n Webhook → Agent → LLM/工具 → SSE 返回。多一跳会增加延迟。

#### 6. 安全

- n8n Webhook 必须鉴权（API Key / JWT）
- MCP 凭证静态加密存储（Supabase Vault 或应用层加密）
- Supabase RLS 实现多租户隔离
- LLM API Key 仅存放在 n8n 环境变量中

#### 7. 配置与编排的边界

| Supabase（Next.js 管理） | n8n 编排 |
|--------------------------|----------|
| 系统提示词 | Agent 推理逻辑 |
| 知识库绑定 | RAG 检索步骤 |
| MCP 服务列表 | 工具调用顺序 |
| 模型选择 | 多 Agent 协作 |
| 用户 / 权限 | 外部 API 集成 |

**原则：** 业务配置在 Supabase；流程逻辑在 n8n。避免在 n8n 节点中硬编码提示词。

---

## 架构方案 B：Node 层编排（Vercel）

### 概览

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel（Next.js）                                           │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │ 前端             │    │ app/api/chat/route.ts        │   │
│  │ Tailwind + 聊天  │───►│ 编排层                       │   │
│  │ shadcn/ui 后台   │    │ Vercel AI SDK                │   │
│  └──────────────────┘    │ - ToolLoopAgent              │   │
│                          │ - streamText                 │   │
│                          │ - @ai-sdk/mcp                │   │
│                          │ - 自定义工具（RAG、DB）       │   │
│                          └──────────────┬───────────────┘   │
└─────────────────────────────────────────┼───────────────────┘
                                          ▼
                              ┌─────────────────────────────┐
                              │ Supabase                    │
                              │ 鉴权 / 配置 / 历史 / 知识库  │
                              └─────────────────────────────┘
```

### 可行性评估

| 组件 | 是否可行 | 说明 |
|------|----------|------|
| 流式 AI 聊天 | ✅ 可行 | Vercel AI SDK + Route Handler SSE |
| 多步 Agent（工具循环） | ✅ 可行 | `ToolLoopAgent`（AI SDK 6+） |
| MCP 集成 | ✅ 可行 | `@ai-sdk/mcp` — 仅支持 HTTP/SSE 传输 |
| 知识库 RAG | ✅ 可行 | 自定义 tool + Supabase pgvector |
| 助理配置 | ✅ 可行 | 每次请求从 Supabase 加载 |
| 全部部署在 Vercel | ✅ 可行 | 单一部署目标 |
| 文档入库（PDF 等） | ⚠️ 需分离 | 聊天 Route 负担过重；使用后台任务 |

### 建议的代码结构

```
app/
  api/chat/route.ts           # JWT 鉴权、加载配置、流式响应
  (pages)/                    # 首页、聊天 UI
  admin/                      # shadcn/ui 后台面板

middleware.ts                 # 刷新 JWT session、保护路由

lib/
  supabase/
    client.ts                 # 浏览器 Client
    server.ts                 # Server / Route Handler
    middleware.ts
  agents/assistant-agent.ts   # ToolLoopAgent 定义
  tools/rag.ts                # 知识库检索 tool
  tools/supabase.ts           # 数据库 tools
  mcp/connect.ts              # 按助理动态连接 MCP
```

### JWT 鉴权方案（已决）

采用 **Supabase Auth 签发 JWT**，MVP 不自建独立 JWT 服务。

| 项 | 选择 |
|----|------|
| 身份认证 | Supabase Auth（邮箱/密码；OAuth 按需） |
| Token | Access JWT（短期）+ Refresh Token |
| Next.js | `@supabase/ssr`（App Router） |
| 传递方式 | HttpOnly Cookie（SSR 默认）或 `Authorization: Bearer` |
| 校验 | Route Handler 内 `supabase.auth.getUser()`（验签，非客户端 decode） |
| 数据隔离 | Postgres RLS，`auth.uid()` 对应 JWT `sub` |
| 特权密钥 | `service_role` 仅服务端；`anon` 给浏览器 |

**典型流程：** 登录 → Supabase 返回 JWT → Cookie / Bearer → middleware 刷新 session → API `getUser()` → 401/业务逻辑 → RLS 过滤行级数据。

**安全：** Chat 及所有业务 API 须鉴权；LLM/MCP 密钥不进 JWT、不进客户端。

### Vercel AI SDK 能力（2026）

| 功能 | 包 / API | 用途 |
|------|----------|------|
| 流式聊天 | `streamText`、`useChat` | 实时 UI |
| Agent 工具循环 | `ToolLoopAgent` | 多步推理 + 工具调用 |
| MCP 客户端 | `@ai-sdk/mcp`、`createMCPClient` | 外部 MCP 工具 |
| UI 流式 | `createUIMessageStream` | 结构化聊天 UI |

### 典型 Chat Route 流程

```typescript
// 概念结构
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: Request) {
  const { message, assistantId, conversationId } = await req.json();

  // 1. JWT 鉴权（supabase.auth.getUser()）
  // 2. 加载助理配置（system_prompt、kb_ids、mcp_servers）
  // 3. 加载对话历史（Supabase）
  // 4. 组装 tools（RAG + MCP + 自定义）
  // 5. ToolLoopAgent.stream({ messages })
  // 6. 流式返回；完成后持久化 assistant 消息

  return agent.stream(...).toUIMessageStreamResponse();
}
```

### 主要难点（方案 B）

#### 1. Serverless 超时 — 最高优先级

启用 **Fluid Compute** 后（Vercel 默认倾向开启）：

| 计划 | 最大时长 |
|------|----------|
| Hobby | 300 秒（5 分钟） |
| Pro | 800 秒（约 13 分钟） |

在 Route 中配置：

```typescript
export const maxDuration = 300; // Hobby 上限 300；Pro 可更高
```

多步 Agent 循环会快速累积延迟：

```
用户提问 → RAG（2s）→ LLM（3s）→ MCP 工具（5s）→ LLM（3s）→ 工具（5s）→ 生成（10s）≈ 28s+
```

**缓解措施：**

- 限制 `maxSteps`（如 5–8 步）
- 为所有上游 `fetch` 设置超时
- 优化首 token 时间（鉴权、配置、RAG 并行执行）
- 极复杂流程卸载到异步任务（Inngest、Trigger.dev）

> **注意：** 流式响应并不能完全避免超时。若 handler 超过 `maxDuration`，连接仍会被切断。

#### 2. 动态 MCP — 可行但有限制

Serverless 无法使用 **stdio MCP**（本地进程）。生产环境需要：

- HTTP 传输
- SSE / Streamable HTTP

按请求建立连接的模式：

```typescript
const clients = await Promise.all(
  assistant.mcpServers.map(s =>
    createMCPClient({ transport: { type: 'http', url: s.url } })
  )
);
const tools = await mergeToolSets(clients);
// 请求结束后关闭 clients
```

**挑战：**

- 每次请求建连有开销（冷启动 + MCP 握手）
- 凭证管理（Supabase 加密存储，运行时解密）
- 用户提供的 MCP URL 不稳定会导致整次对话失败
- AI SDK MCP 客户端缺少完整的 session 管理 / 可恢复流

**建议：** 对常用集成使用 MCP Gateway 代理；MVP 阶段限制任意用户 URL。

#### 3. 知识库 — 区分在线与离线

| 任务 | 执行位置 |
|------|----------|
| 聊天 + 在线 RAG 检索 | Vercel Route Handler（约 1–3 秒） |
| 文档上传、分块、批量 Embedding | 后台任务（Inngest、Trigger.dev、Supabase Edge Function） |

**不要**在 chat route 中执行 PDF 解析或批量 Embedding。

#### 4. 长时运行 / 复杂流程

n8n 擅长可视化多系统集成自动化。在 Vercel 上的替代方案：

| 需求 | 方案 |
|------|------|
| 简单 Agent 循环 | Vercel AI SDK `ToolLoopAgent` |
| 长时 / 可恢复流程 | Inngest、Trigger.dev、Vercel Workflows |
| 定时知识库同步 | Vercel Cron + 后台任务 |
| 可视化流程编辑 | 不可用 — 依赖代码 + 观测工具 |

对于聊天 + RAG + MCP + 配置，通常不需要外部编排引擎。

#### 5. 其他 Serverless 限制

| 限制 | 影响 | 缓解措施 |
|------|------|----------|
| 冷启动 | 首条消息较慢 | Fluid Compute、精简依赖 |
| 无持久内存 | 请求间 Agent 状态丢失 | 对话历史持久化到 Supabase |
| 数据库连接池 | Serverless 下连接池易耗尽 | Supabase JS client / Supavisor |
| 并发计费 | 多步 Agent 占用函数时间更长 | 监控 Function Duration 用量 |
| Edge vs Node 运行时 | Edge 对 npm API 有限制 | MCP、PDF 等使用 `runtime = 'nodejs'` |

#### 6. 相比 n8n 失去的能力

| n8n 提供 | Node 层需自行实现 |
|----------|-------------------|
| 可视化 workflow 编辑器 | TypeScript 代码编排 |
| 非开发人员修改流程 | 改代码 + 部署 |
| 400+ 集成节点 | 自定义 tool 或直接调 API |
| 内置执行历史 UI | Vercel Logs、Langfuse、Axiom |
| 原生重试 / 分支 | Inngest 或手写重试逻辑 |

对于聊天优先的 AI 助理平台，这是可接受的权衡。

---

## 对比分析

| 维度 | 方案 A：n8n | 方案 B：Node + Vercel |
|------|-------------|----------------------|
| 部署复杂度 | ⚠️ 两套系统（Vercel + n8n 主机） | ✅ 单一 Vercel 部署 |
| 聊天延迟 | ⚠️ 多一跳 Webhook | ✅ 直连 |
| 流式体验 | ⚠️ 有限（中间步骤不流式） | ✅ 完整 token 流式 |
| 动态助理配置 | ⚠️ Webhook payload + 表达式 | ✅ 按请求自然组装 |
| MCP 多租户 | ⚠️ 静态节点，需变通 | ⚠️ 动态客户端，仅 HTTP |
| 知识库 RAG | ✅ Vector Store Tool | ✅ 自定义 tool + pgvector |
| 复杂自动化 | ✅ 可视化，400+ 集成 | ⚠️ 需 Inngest 等 |
| 非开发人员改流程 | ✅ 支持 | ❌ 不支持 |
| 运维成本 | ⚠️ 较高 | ✅ 较低 |
| 类型安全 | ⚠️ 有限 | ✅ 端到端 TypeScript |
| 与 7ai-club 需求匹配度 | 中等 | **强** |

---

## 推荐方案

**主要推荐：方案 B — 使用 Vercel AI SDK 的 Node 层编排。**

理由：

1. 产品是**聊天优先**的可配置助理平台，而非通用自动化平台
2. Vercel + Supabase + AI SDK 是该场景的标准技术栈
3. 更低延迟和更好的流式体验直接提升 UX
4. 按助理动态组装配置，在代码中比 n8n workflow 更简单
5. 单一部署降低早期项目的运维负担

**何时重新考虑 n8n（或引入 Inngest）：**

- 复杂的多系统集成自动化（CRM 同步、定时报告、审批流）
- 非技术团队需要在不部署的情况下修改对话流程
- 集成需求超出自定义 tool 的合理范围

**混合模式（未来）：**

```
聊天 + RAG + MCP + 助理配置  →  Vercel AI SDK（方案 B）
复杂后台自动化              →  Inngest 或 n8n（按需引入）
```

---

## 实施路线图

### 阶段 1 — MVP 聊天

- [ ] Next.js 项目脚手架（App Router、Tailwind、shadcn/ui）
- [ ] Supabase Auth JWT + `@supabase/ssr`、middleware、基础表（assistants、conversations、messages）
- [ ] 助理 CRUD 后台（系统提示词、模型选择）
- [ ] `streamText` 聊天 API route + 流式 UI（`useChat`）
- [ ] 配置 `maxDuration = 300`、`runtime = 'nodejs'`

### 阶段 2 — 知识库

- [ ] Supabase pgvector 配置
- [ ] 文档上传 UI + Supabase Storage
- [ ] **后台任务**处理分块 + Embedding（不在 chat route 中）
- [ ] Agent 内 RAG 检索 tool
- [ ] 助理 ↔ 知识库绑定

### 阶段 3 — Agent + 工具

- [ ] 迁移至 `ToolLoopAgent`，限制步数
- [ ] 自定义 tools（数据库查询、外部 API）
- [ ] 从 Supabase 历史记录加载对话记忆
- [ ] 可观测性（Langfuse 等）

### 阶段 4 — MCP

- [ ] `@ai-sdk/mcp` 集成（仅 HTTP/SSE）
- [ ] 后台绑定助理 ↔ MCP 服务
- [ ] 凭证加密存储
- [ ] MCP Gateway 提升生产稳定性（可选）

### 阶段 5 — 生产加固

- [ ] 限流、输入校验
- [ ] Supabase RLS 审计
- [ ] MCP / 知识库不可用时的错误处理与优雅降级
- [ ] 成本监控（LLM token、Vercel function duration）

---

## 待决问题

1. **LLM 提供商：** 第一天就用 OpenAI、Anthropic，还是多提供商？
2. **Embedding 模型：** OpenAI `text-embedding-3-small` 还是开源模型？
3. **MVP 中的 MCP：** 支持用户自定义 MCP URL，还是仅精选列表？
4. **多租户：** 每用户独立 workspace，还是团队 / 组织模型？
5. **后台任务：** 文档入库用 Inngest、Trigger.dev 还是 Supabase Edge Functions？
6. **可观测性：** v1 用 Langfuse、Axiom 还是 Vercel 原生日志即可？

---

## 参考资料

- [Vercel AI SDK — Agents Overview](https://ai-sdk.dev/docs/agents/overview)
- [Vercel AI SDK — MCP Tools](https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools)
- [Vercel AI SDK — Timeout Troubleshooting](https://ai-sdk.dev/docs/troubleshooting/timeout-on-vercel)
- [Vercel — Streaming Functions](https://vercel.com/docs/functions/streaming-functions)
- [n8n — AI Agents Documentation](https://docs.n8n.io/advanced-ai/agents/)
- [n8n — MCP Server Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.mcptrigger/)
- [Supabase — pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)

---

*文档维护于 `/docs/research/` — 架构决策确定后请及时更新。*
