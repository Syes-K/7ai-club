# 7ai-club

[English](README.md)

聊天优先、可配置 AI 助理的 Web 平台。用户可创建助理、进行流式对话，并为每个助理配置系统提示词、知识库与 MCP 工具。

**当前状态：** 架构调研与 Cursor 开发工作流已就绪；应用代码尚未脚手架化。

---

## 技术栈

| 层 | 选择 |
|----|------|
| 前端 | Next.js App Router + Tailwind |
| 后台 | shadcn/ui |
| 数据 | Supabase（Auth、PostgreSQL、pgvector、Storage） |
| 鉴权 | Supabase Auth JWT + `@supabase/ssr` |
| AI 编排 | Vercel AI SDK（`ToolLoopAgent`、`streamText`） |
| MCP（运行时） | `@ai-sdk/mcp`（HTTP/SSE） |
| 部署 | Vercel |

架构决策详见 [`docs/research/ai-agent-platform-architecture-cn.md`](docs/research/ai-agent-platform-architecture-cn.md)（英文版：[`ai-agent-platform-architecture.md`](docs/research/ai-agent-platform-architecture.md)）。

---

## 仓库结构

```
docs/
  research/            # 架构调研（只读参考）
  features/<slug>/     # 功能 PRD + 技术设计
  iterations/<id>/     # 迭代计划与发布索引

.cursor/
  agents/              # 自定义 subagent
  rules/               # 工作流门禁
  skills/              # 架构、PRD、UI 等技能与模板
  mcp.json             # 项目 MCP（Supabase）
```

---

## 文档约定

| 类型 | 路径 |
|------|------|
| PRD | `docs/features/<slug>/01-product-requirements.md` |
| 技术设计 | `docs/features/<slug>/02-technical-design.md` |
| 迭代索引 | `docs/iterations/<iter-id>/README.md` |

**原则：** Feature 目录存放可长期修订的需求与设计；迭代目录只记录本时间盒的目标与包含的 features，不重复存放 PRD 正文。

---

## Cursor 开发工作流

本项目使用两阶段 subagent + 人工确认门禁：

| 阶段 | Subagent | 产出 |
|------|----------|------|
| 1 | `product-analyst` | PRD |
| 2 | `fullstack-developer` | 技术设计 → 编码 |

**确认话术：**

- PRD：`PRD 已确认，可进入技术设计`
- 技术设计：`技术设计已确认，可开始编码`

**调用示例：**

```
用 product-analyst 分析 MVP 聊天，slug: mvp-chat，迭代: iter-01
```

```
用 fullstack-developer 读取 docs/features/mvp-chat/01-product-requirements.md，先做技术设计
```

配置说明见 `.cursor/rules/7ai-club-workflow.mdc`。

---

## 实施路线图

| 阶段 | 内容 |
|------|------|
| 1 — MVP 聊天 | Auth、助理 CRUD、流式聊天 API + UI |
| 2 — 知识库 | pgvector、文档入库、RAG |
| 3 — Agent | `ToolLoopAgent`、自定义 tools、对话记忆 |
| 4 — MCP | 助理绑定 MCP、凭证管理 |
| 5 — 生产加固 | 限流、RLS 审计、可观测性 |

---

## 本地开发（脚手架完成后）

```bash
# 依赖安装与启动命令将在 Next.js 脚手架落地后补充
cp .env.example .env.local   # 配置 Supabase / LLM 密钥
```

环境变量（规划）：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 匿名公钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端（勿暴露给浏览器） |
| LLM 相关 | 按所选提供商配置 |

---

## MCP（Cursor IDE）

项目已配置 [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)。复制并填写项目 ID：

```bash
cp .cursor/mcp.json.example .cursor/mcp.json
```

在 Cursor Settings → MCP 中启用 `supabase` 并完成 OAuth。推荐 URL 带 `project_ref` 与 `read_only=true`。

开发期还可启用：Context7（库文档）、Playwright（E2E）。

---

## License

See [LICENSE](LICENSE).
