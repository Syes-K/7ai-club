# 7ai-club

[English](README.md)

聊天优先、可配置 AI 助理的 Web 平台 — 流式对话、知识库 RAG、Console 管理与 Workflow 可观测性。

| | |
|---|---|
| **生产站点** | [https://7ai-club.vercel.app](https://7ai-club.vercel.app) |
| **本地开发** | [http://localhost:3000](http://localhost:3000) |
| **最新发布** | [iter-11](docs/iterations/iter-11/README-cn.md) — Vercel Analytics & Speed Insights（[en](docs/iterations/iter-11/README.md)） |

---

## 技术栈

| 层 | 选择 |
|----|------|
| 前端 | Next.js App Router + Tailwind |
| Console | shadcn/ui |
| 数据 | Supabase（Auth、PostgreSQL、pgvector、Storage） |
| 鉴权 | Supabase Auth JWT + `@supabase/ssr` |
| AI | Vercel AI SDK（`ToolLoopAgent`、`streamText`、RAG workflow） |
| 可观测性 | Vercel Web Analytics + Speed Insights |
| 部署 | Vercel |

架构决策：[`docs/research/ai-agent-platform-architecture-cn.md`](docs/research/ai-agent-platform-architecture-cn.md) · [English](docs/research/ai-agent-platform-architecture.md)

---

## 文档

| 类型 | 路径 |
|------|------|
| 索引 | [`docs/README-cn.md`](docs/README-cn.md) · [English](docs/README.md) |
| Feature PRD / 设计 | `docs/features/<slug>/` |
| 迭代发布 | `docs/iterations/<iter-id>/` |

**原则：** Feature 文档长期维护；迭代目录仅作时间盒发布索引。中英文成对（`*.md` + `*-cn.md`）。

### Cursor 工作流

三阶段 subagent + 门禁：**PRD → 技术设计 → 编码 → 测试验收**。

| 阶段 | Subagent |
|------|----------|
| 需求 | `product-analyst` |
| 设计 + 编码 | `fullstack-developer` |
| 测试签字 | `qa-engineer` |

门禁话术与完整规则：[`.cursor/rules/7ai-club-workflow.mdc`](.cursor/rules/7ai-club-workflow.mdc)。

---

## 路线图（阶段）

| 阶段 | 内容 |
|------|------|
| 1 — MVP 聊天 | Auth、助理、流式聊天 |
| 2 — 知识库 | pgvector、入库、RAG |
| 3 — Agent | Workflow 步骤、流恢复、记忆 |
| 4 — MCP | 助理绑定 MCP |
| 5 — 生产 | Analytics、限流、加固 |

---

## 本地开发

```bash
pnpm install
cp .env.example .env.local
pnpm dev          # http://localhost:3000
```

**数据库：** 执行 `supabase/migrations/` 下迁移（如 `supabase db push`）。

### 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest 单元测试 |
| `pnpm test:e2e` | Playwright E2E（本地建议 `CI=1`） |
| `pnpm test:ci` | lint + build + unit + e2e |

### 主要环境变量

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SITE_URL` | 站点 canonical 地址（生产：`https://7ai-club.vercel.app`）。见 `lib/site-url.ts`；本地可省略（回退 `window.location.origin` 或 `VERCEL_URL`）。 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | 仅服务端 — 加密 API Key、管理操作 |
| `LLM_ENCRYPTION_KEY` | 仅服务端 — 用户 LLM Key 的 AES-256-GCM |
| `BAILIAN_API_KEY` | 平台默认 LLM（阿里百炼 / DashScope） |
| `UPSTASH_REDIS_*` | 流式恢复（iter-06+）；本地可选 |

完整列表见 [`.env.example`](.env.example)。

**运行时站点 URL：** [`lib/site-url.ts`](lib/site-url.ts)（`getSiteUrl()`、`siteUrl(path)`）。

---

## 部署到 Vercel

**生产站点：** [https://7ai-club.vercel.app](https://7ai-club.vercel.app)

1. **环境变量** — Vercel → Project → Settings → Environment Variables。Production 至少配置：

   | 变量 | 生产示例 |
   |------|----------|
   | `NEXT_PUBLIC_SITE_URL` | `https://7ai-club.vercel.app` |
   | `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 匿名公钥 |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role（仅服务端） |
   | `LLM_ENCRYPTION_KEY` | `openssl rand -base64 32` |
   | `BAILIAN_API_KEY` | 平台 LLM Key |
   | `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | 流恢复 |

   密钥**不要**加 `NEXT_PUBLIC_` 前缀。

2. **修改环境变量后 Redeploy**。

3. **Supabase Auth** — Authentication → URL Configuration：

   - **Site URL：** `https://7ai-club.vercel.app`
   - **Redirect URLs：** `https://7ai-club.vercel.app/**`、`http://localhost:3000/**`

4. **Vercel Analytics**（iter-11）— 项目 Settings 开启 **Web Analytics** 与 **Speed Insights**，然后重新部署。

5. **函数超时** — Chat 使用 `maxDuration`；过慢模型需 Pro 或换更快模型。

---

## MCP（Cursor IDE）

```bash
cp .cursor/mcp.json.example .cursor/mcp.json   # 填写 project_ref
```

在 Cursor Settings 启用 **Supabase** MCP。可选：Context7、Playwright。

---

## License

See [LICENSE](LICENSE).
