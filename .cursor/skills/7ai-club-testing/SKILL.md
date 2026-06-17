# 7ai-club 测试

本 skill 定义 7ai-club 的测试目录、命令、AC 映射与手工/自动边界。`qa-engineer` subagent 与编码完成后的验收均遵循此约定。

## 何时使用

- 用户要求测试验收、跑 E2E、补充测试用例
- `fullstack-developer` 编码完成后的测试交接
- 编写或更新 `tests/` 下用例

## 测试金字塔

| 层级 | 命令 | 目录 | 覆盖 |
|------|------|------|------|
| 静态 | `pnpm lint`、`pnpm build` | — | 类型、lint、生产构建 |
| 单元 | `pnpm test` | `tests/unit/` | `lib/validation/*`、`lib/services/*` 纯逻辑 |
| E2E | `pnpm test:e2e` | `tests/e2e/` | 登录、聊天 UI、Console CRUD |
| CI 聚合 | `pnpm test:ci` | — | lint + build + unit + e2e |
| 手工 | — | changelog § 手工 QA | LLM 流式、第三方 provider、视觉 |

## 目录结构

```
tests/
  unit/                 # *.test.ts — Vitest
  e2e/                  # *.spec.ts — Playwright
  fixtures/             # 共享测试数据（可选）
```

## AC 映射约定

- 单元测试：`tests/unit/<module>.test.ts`，describe 块标注 `AC-XX`
- E2E：`tests/e2e/<flow>.spec.ts`，test 名称含 `AC-XX`
- changelog 验收清单与测试文件保持同步

示例：

```typescript
// tests/unit/assistant-validation.test.ts
describe("AC-32 validateAssistantCreate", () => { ... });
```

```typescript
// tests/e2e/console-assistants.spec.ts
test("AC-32: console assistants CRUD", async ({ page }) => { ... });
```

## 自动化 vs 手工边界

| 场景 | 方式 |
|------|------|
| 表单校验、parse 函数 | Vitest 单元 |
| 页面可访问、路由、未登录跳转 | Playwright E2E |
| 浏览器 Supabase CRUD（RLS） | Playwright E2E + 测试账号 |
| LLM 流式输出内容 | **手工**（E2E 仅断言请求发出 / UI 状态） |
| Bailian / 第三方 provider | **手工** re-test |
| RLS 双账号隔离 | E2E 两账号 或 Supabase MCP 查数据 |

## 环境

| 变量 | 用途 |
|------|------|
| `.env.local` | 本地 dev / E2E（勿提交） |
| `PLAYWRIGHT_BASE_URL` | E2E base URL（默认 `http://127.0.0.1:3000`） |

E2E 本地：`pnpm build && pnpm test:e2e`（Playwright 会启动 `pnpm start`）。

测试账号：在 Supabase 创建专用 test user；凭证放 `.env.local`，E2E 用 `tests/e2e/auth.setup.ts`（待补充）。

## MCP（测试阶段）

| MCP | 用途 |
|-----|------|
| **Playwright MCP** | Agent 驱动浏览器做探索性 QA |
| **Supabase MCP** | 验证表数据、RLS、`execute_sql` |
| **Context7** | Vitest / Playwright 文档（全局） |

项目 `.cursor/mcp.json` 已配置 Playwright；工具过多时可临时关闭 shadcn MCP。

## 标准验收流程（qa-engineer）

```
1. 读 changelog/iter-NN-cn.md
2. pnpm lint && pnpm build
3. pnpm test
4. pnpm test:e2e
5. 执行 changelog § 手工 QA
6. 勾选 AC；更新 iter README 状态（用户确认发布后）
```

## 新增测试 checklist

- [ ] 对应 AC-ID 已标注
- [ ] 单元测试不依赖真实 LLM / Supabase（mock 或纯函数）
- [ ] E2E 不断言模型回复正文
- [ ] `pnpm test:ci` 本地通过后再勾选 AC

## 相关文档

- 工作流门禁：`.cursor/rules/7ai-club-workflow.mdc`
- 架构与 Playwright 说明：`.cursor/skills/7ai-club-architecture/reference.md` → 开发工具 MCP
