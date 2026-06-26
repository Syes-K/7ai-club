# 7ai-club 测试

本 skill 定义 7ai-club 的测试目录、命令、**Test Matrix**、AC 映射与三阶段 QA 流程。`qa-engineer` subagent 与编码完成后的验收均遵循此约定。

## 何时使用

- 用户要求测试验收、跑 E2E、补充测试用例
- `fullstack-developer` 编码完成后的测试交接
- 编写或更新 `tests/` 下用例
- 编写 changelog §5.1 Test Matrix、§12 Manual Script

## 验收文档分层（Who / Where）

| 文档 | 内容 | AC checkbox | 负责人 |
|------|------|-------------|--------|
| **PRD** `prd/*.md` § 验收标准 | AC 定义（**What**） | **保持 `[ ]`**（定义态，非验收源） | product-analyst |
| **技术设计** `design/*` **§12** | 实现要点 + 建议验证方式（**How 初稿**） | 无 | fullstack-developer Phase A |
| **changelog** `changelog/iter-NN*.md` **§5** | AC 一览 + **§5.1 Test Matrix** | **仅 qa-engineer 勾选** | qa-engineer Phase C4 |
| **changelog §12** | Manual Script + 证据 | 无 checkbox | qa-engineer C0 写、C3 填 |

**原则：** 可执行的验收步骤与证据只在 **changelog**；PRD 不重复长步骤，不在发布前勾选。

## 测试流水线（PRD → code → 执行）

```
1. PRD AC (What)
2. design §12 验收映射 (How — 技术设计确认时必填)
3. dev Phase B: 单元 + 主路径 E2E (TDD，对齐 §12)
4. qa C0: 展开 changelog §5.1 + §12
5. qa C1: 补自动化缺口 tests/
6. qa C2: pnpm lint / build / test / e2e
7. qa C3: 手工 + 填证据
8. qa C4: 勾选 changelog §5 AC
```

## qa-engineer 三阶段（Phase C 子阶段）

| 子阶段 | 名称 | 产出 |
|--------|------|------|
| **C0** | 用例设计 | changelog §5.1 Test Matrix + §12 Manual Script |
| **C1** | 测试实现 | 补/改 `tests/unit/`、`tests/e2e/`（AC-XX 标注） |
| **C2** | 自动化执行 | lint · build · test · e2e 结果表 |
| **C3** | 手工 QA | §12 结果 + §5.1 证据列 |
| **C4** | 验收签字 | 勾选 §5 AC · 验收报告 · 待发布确认 |

dev Phase B 与 qa C1 分工见 `.cursor/agents/qa-engineer.md` § C1。

## Test Matrix 字段（§5.1 每行 AC）

| 字段 | 说明 |
|------|------|
| **AC ID** | 与 PRD/changelog 一致，如 AC-72 |
| **前提** | 账号、Preferences、是否已有 summary、数据状态 |
| **操作步骤** | 编号列表，含路由/按钮 |
| **期望结果** | 可观察、可判定 pass/fail |
| **验证方式** | `unit` · `e2e` · `manual` · `static` · `Supabase MCP` · 组合 |
| **自动化覆盖** | `tests/unit/foo.test.ts` 或「无，仅手工」 |
| **证据** | qa C2/C3 填写：命令输出摘要、SQL、UI 状态 |

模板：`.cursor/skills/iteration-planning/templates/changelog-iter-template-cn.md`

## Manual Script 字段（§12 每行 M-xx）

| 字段 | 说明 |
|------|------|
| **#** | M-01, M-02… |
| **映射 AC** | AC-XX |
| **场景** | 短标题 |
| **前提 / 步骤 / 期望** | 与 Matrix 一致或更细 |
| **结果** | pass / fail（C3 填） |
| **证据** | 截图路径、查询结果一句（C3 填） |

## 测试金字塔

| 层级 | 命令 | 目录 | 覆盖 |
|------|------|------|------|
| 静态 | `pnpm lint`、`pnpm build` | — | 类型、lint、生产构建 |
| 单元 | `pnpm test` | `tests/unit/` | `lib/validation/*`、`lib/services/*` 纯逻辑 |
| E2E | `pnpm test:e2e` | `tests/e2e/` | 登录、聊天 UI、Console CRUD |
| CI 聚合 | `pnpm test:ci` | — | lint + build + unit + e2e |
| 手工 | — | changelog §12 | LLM 流式、第三方 provider、视觉 |

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
- changelog §5.1「自动化覆盖」列与测试文件保持同步
- design §12 每行 AC 至少一种验证方式

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
| DB 归档 / `summarized_at` | Supabase MCP 或 E2E + 查库 |

## 环境

| 变量 | 用途 |
|------|------|
| `.env.local` | 本地 dev / E2E（勿提交） |
| `PLAYWRIGHT_BASE_URL` | E2E base URL（默认 `http://127.0.0.1:3000`） |

E2E 本地：`pnpm build && pnpm test:e2e`（Playwright 会启动 `pnpm start`）。

**CI=1：** 本地 E2E 建议 `CI=1 pnpm test:e2e`，避免 `reuseExistingServer` 复用旧 dev 进程。

测试账号：Supabase 专用 test user；凭证放 `.env.local`（`E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`）。

## MCP（测试阶段）

| MCP | 用途 |
|-----|------|
| **Playwright MCP** | Agent 驱动浏览器做探索性 QA |
| **Supabase MCP** | 验证表数据、RLS、`execute_sql` |
| **Context7** | Vitest / Playwright 文档（全局） |

## 标准验收流程（qa-engineer）

```
C0  读 PRD AC + design §12 + changelog §5 → 写 §5.1 + §12
C1  补 tests/（缺口）
C2  pnpm lint && pnpm build && pnpm test && CI=1 pnpm test:e2e
C3  执行 §12；填证据
C4  勾选 §5 AC；验收报告；提示「测试已通过，可发布」
```

## 新增测试 checklist

- [ ] design §12 已有该 AC 行
- [ ] changelog §5.1 已有该 AC 行（C0）
- [ ] 对应 AC-ID 已标注于 tests/
- [ ] 单元测试不依赖真实 LLM / Supabase（mock 或纯函数）
- [ ] E2E 不断言模型回复正文
- [ ] C2 全部通过后再 C4 勾选 AC

## 相关文档

- 工作流门禁：`.cursor/rules/7ai-club-workflow.mdc`
- QA subagent：`.cursor/agents/qa-engineer.md`
- Changelog 模板：`.cursor/skills/iteration-planning/templates/changelog-iter-template-cn.md`
- 架构与 Playwright：`.cursor/skills/7ai-club-architecture/reference.md` → 开发工具 MCP
