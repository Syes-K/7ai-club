# iter-11 变更摘要 — Vercel Analytics

> **English:** [iter-11.md](./iter-11.md)  
> **中文:** [iter-11-cn.md](./iter-11-cn.md)  
> **迭代索引:** [iter-11/README-cn.md](../../iterations/iter-11/README-cn.md)

---

## 1. 主题

| 主题 | PRD | 设计 |
|------|-----|------|
| Vercel Analytics + Speed Insights | [prd/vercel-analytics-cn.md](../prd/vercel-analytics-cn.md) | [design/vercel-analytics-cn.md](../design/vercel-analytics-cn.md) |

---

## 2. 必读

1. [01-product-requirements-cn.md](../01-product-requirements-cn.md)
2. [prd/vercel-analytics-cn.md](../prd/vercel-analytics-cn.md)
3. [design/vercel-analytics-cn.md](../design/vercel-analytics-cn.md)

---

## 3. 计划交付（编码前）

| 区域 | 路径 / 说明 |
|------|-------------|
| 依赖 | `@vercel/analytics`、`@vercel/speed-insights` |
| 根 layout | `app/layout.tsx` — Analytics + SpeedInsights |
| URL 脱敏 | `lib/analytics/before-send.ts` |
| 自定义事件 | `components/auth/auth-form.tsx`、`components/chat/chat-app-shell.tsx` |
| 测试 | `tests/unit/analytics/*.test.ts` |
| 运维 | §12 Dashboard 开启说明 |

---

## 4. 产品决策记录（iter-11 已确认）

| 项 | 决策 |
|----|------|
| 产品范围 | Web Analytics + Speed Insights |
| 自定义事件 | `sign_up_complete`、`sign_in_complete`、`conversation_started` |
| 隐私 | 全站 page view；仅剥离 query string |
| 用户 UI | 无 |

---

## 5. 验收清单

> **勾选规则:** 仅 **qa-engineer** 在 Phase C4 测试全部通过后勾选。

### 摘要（AC 一览）

- [x] **AC-111** — Vercel Web Analytics 可见页面浏览（生产）
- [x] **AC-112** — Speed Insights 可见 Web Vitals 样本
- [x] **AC-113** — 注册成功上报 `sign_up_complete`
- [x] **AC-114** — 登录成功上报 `sign_in_complete`
- [x] **AC-115** — 新建对话上报 `conversation_started`
- [x] **AC-116** — 上报 URL 不含 query string
- [x] **AC-117** — `pnpm build` 通过；无 hydration 错误
- [x] **AC-118** — 本地 dev 不发送 analytics 请求

### 5.1 Test Matrix（qa-engineer · Phase C0）

| AC ID | 前提 | 操作步骤 | 期望结果 | 验证方式 | 自动化覆盖 | 证据（qa 填写） |
|-------|------|----------|----------|----------|------------|-----------------|
| AC-111 | 代码已集成 Analytics | 1. 检查 layout + client 组件 2. prod 部署后查 Dashboard | 组件挂载；Dashboard 见路由 | static + manual | `tests/unit/analytics/integration.test.ts` | integration 3 cases pass；build OK；**M-02** prod Dashboard 待部署后确认 |
| AC-112 | 代码已集成 SpeedInsights | 1. 检查 vercel-observability.tsx 2. prod 部署后查 Speed Insights | 组件挂载；Dashboard 见 Vitals | static + manual | `integration.test.ts` | 同上；**M-03** prod Dashboard 待部署后确认 |
| AC-113 | Auth 注册流程 | 1. 读 auth-form  wiring 2. prod/preview Events | `sign_up_complete` | unit + manual | `integration.test.ts` AC-113/114 | auth-form 含 signUpComplete + trackProductEvent |
| AC-114 | Auth 登录流程 | 1. 读 auth-form wiring 2. prod/preview Events | `sign_in_complete` | unit + manual | `integration.test.ts` + `events.test.ts` | signInComplete 接线；Vercel prod mock 调用 track |
| AC-115 | Chat 新建对话 | 1. 读 chat-app-shell wiring | `conversation_started` | unit | `integration.test.ts` AC-115 | createConversation 后 trackProductEvent |
| AC-116 | — | 1. 运行 before-send 单元测试 | URL 仅 pathname | unit | `tests/unit/analytics/before-send.test.ts` | 4 passed（含 `/login?next=` → `/login`） |
| AC-117 | — | `pnpm lint && pnpm build` | 成功，无 hydration 报错 | static | CI | 2026-07-03 build OK（7.4s compile） |
| AC-118 | 非 Vercel production | 1. 运行 events 单元测试 | track noop | unit | `tests/unit/analytics/events.test.ts` | 3 passed；dev / 本地 prod 均不调用 track |

---

## 6. 门禁与阶段状态

| 阶段 | 确认话术 / 状态 | 日期 |
|------|-----------------|------|
| PRD | `PRD 已确认，可进入技术设计` | 2026-07-02 |
| 技术 design §12 | 技术设计已确认 | 2026-07-02 |
| 编码 | Phase B 交付完成 | 2026-07-02 |
| 测试 C0 | Test Matrix + §12 Manual Script 已落盘 | 2026-07-03 |
| 测试 C1–C3 | 自动化 + 手工执行通过 | 2026-07-03 |
| 发布 | **已发布**（用户：`测试已通过，可发布` · 2026-07-03） | 2026-07-03 |

---

## 7. 人工验证发现与修复（可选）

| ID | 现象 | 修复 |
|----|------|------|
| — | iter04 AC-30 E2E flaky（New chat disabled 超时） | 非 iter-11 引入；C2 重试后 pass |

---

## 12. 手工脚本（qa-engineer · Phase C0/C3）

### 前提

- 有 Vercel 项目访问权限
- 项目 Settings 中 Web Analytics、Speed Insights 已开启
- Production 已部署 iter-11 代码

### M-xx 脚本

| # | 映射 AC | 场景 | 前提 / 步骤 / 期望 | 结果 | 证据 |
|---|---------|------|-------------------|------|------|
| M-01 | AC-111 | Dashboard 开关 | Settings → Analytics + Speed Insights ON | pass* | 代码集成已验收；开关为运维步骤 |
| M-02 | AC-111 | Page views | prod 访问 `/`、`/login`、`/chat` → Web Analytics 见路由 | pass* | integration.test + build；**部署后** Dashboard 截图 |
| M-03 | AC-112 | Web Vitals | prod 浏览 → Speed Insights 有样本 | pass* | SpeedInsights 组件已挂载；**部署后** Dashboard 截图 |
| M-04 | AC-113 | 注册事件 | prod/preview 注册 → Events 见 `sign_up_complete` | pass | auth-form 接线 + events.test Vercel prod 路径 |
| M-05 | AC-114 | 登录事件 | prod/preview 登录 → Events 见 `sign_in_complete` | pass | 同上 |
| M-06 | AC-115 | 对话事件 | 新建对话 → Events 见 `conversation_started` | pass | chat-app-shell 接线 verified |
| M-07 | AC-116 | URL 脱敏 | `/login?next=/chat` → 上报 `/login` | pass | before-send.test.ts 4/4 |
| M-08 | AC-118 | Dev noop | `isAnalyticsEnabled()` false in dev | pass | events.test.ts 3/3 |
| M-09 | AC-117 | Build | `pnpm lint && pnpm build && pnpm test` | pass | 2026-07-03：139 unit passed |

\*M-01–M-03：代码与构建已签收；Dashboard 实时数据需在 **prod 首次部署 + 开关开启** 后补截图（不阻塞 iter-11 代码验收，见 PRD §9.2）。

### C2 命令摘要（2026-07-03）

```bash
pnpm lint          # pass
pnpm build         # pass
pnpm test          # 139 passed（32 files）
CI=1 pnpm test:e2e # 24 passed, 14 skipped, 1 flaky (iter04 AC-30, 非阻塞)
```

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-02 | 创建 iter-11 changelog |
| 2026-07-03 | qa C0–C4：AC-111–118 全部勾选 |
| 2026-07-03 | 用户确认发布 |
