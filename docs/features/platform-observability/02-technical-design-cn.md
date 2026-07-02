# 平台可观测性 — 技术设计总纲

> **English:** [02-technical-design.md](./02-technical-design.md)  
> **中文:** [02-technical-design-cn.md](./02-technical-design-cn.md)

> **项目:** 7ai-club  
> **Feature slug:** `platform-observability`  
> **迭代:** `iter-11`  
> **路线图阶段:** 5 — 生产（可观测性基础）  
> **关联 PRD:** [01-product-requirements-cn.md](./01-product-requirements-cn.md)  
> **状态:** 已确认  
> **技术设计确认日期:** 2026-07-02  
> **文档版本:** v0.1

---

## 1. 概述

### 1.1 设计目标

- 在应用根 layout 一次性挂载 Vercel Web Analytics 与 Speed Insights
- page view 上报前剥离 URL query string
- 在现有 Client Component 成功回调处触发 3 个自定义事件
- 无 DB/API 变更；采集失败不影响核心业务

### 1.2 架构对齐

| 项 | 选择 |
|----|------|
| 部署 | Vercel（已有） |
| 集成点 | 根 layout + 2 个现有 Client Component |
| 数据存储 | 无（仅 Vercel Dashboard） |
| 鉴权 / RLS | 不变 |
| 用户 UI | 无可见变更 |

---

## 2. 文档地图

| 主题 | 设计子文档 |
|------|------------|
| Vercel Analytics + Speed Insights | [design/vercel-analytics-cn.md](./design/vercel-analytics-cn.md) |

**本迭代 changelog:** [changelog/iter-11-cn.md](./changelog/iter-11-cn.md)

---

## 3. 数据库

**无变更。** iter-11 不需要 migration、新表或 RLS。

---

## 4. API

**无变更。** 不新增 Route Handler；自定义事件走客户端 `track()`。

---

## 5. 流程（摘要）

```mermaid
flowchart LR
  subgraph client [浏览器]
    PV[页面导航] --> A[@vercel/analytics]
    BS[beforeSend 脱敏] --> A
    Auth[AuthForm 成功] --> T[trackProductEvent]
    Chat[createConversation 成功] --> T
    T --> A
    SI[@vercel/speed-insights] --> V[Vercel ingest]
    A --> V
  end
  V --> D[Vercel Dashboard]
```

---

## 6. 页面与路由

无路由变更。挂载 `<Analytics />` 后，现有路由自动产生 page view。

| 路由组 | Page view | 自定义事件 |
|--------|-----------|------------|
| `/`、`/login`、`/register` | 自动 | Auth 成功 |
| `/chat`、`/chat/[id]` | 自动 | 新建对话 → `conversation_started` |
| `/console/**` | 自动 | — |

---

## 7. 组件摘要

| 组件 | 类型 | 职责 |
|------|------|------|
| `VercelObservability` | Client | 封装 `<Analytics beforeSend={...} />` + `<SpeedInsights />` |
| `AuthForm` | Client（已有） | +2 处 `trackProductEvent` |
| `ChatAppShell` | Client（已有） | +1 处 `trackProductEvent` |

详见 [design/vercel-analytics-cn.md](./design/vercel-analytics-cn.md)。

---

## 8. lib 模块

| 路径 | 职责 |
|------|------|
| `lib/analytics/before-send.ts` | 纯函数 `redactAnalyticsEventUrl`，供 `beforeSend` 使用 |
| `lib/analytics/events.ts` | 事件名常量 + 带守卫的 `trackProductEvent()` |
| `lib/analytics/index.ts` | 统一导出 |

---

## 9. 文件变更清单

| 操作 | 路径 | 说明 |
|------|------|------|
| 新增 | `package.json` | 依赖 `@vercel/analytics`、`@vercel/speed-insights` |
| 新增 | `lib/analytics/before-send.ts` | URL 脱敏 |
| 新增 | `lib/analytics/events.ts` | 事件封装 |
| 新增 | `lib/analytics/index.ts` | Barrel |
| 新增 | `components/analytics/vercel-observability.tsx` | Client 挂载组件 |
| 修改 | `app/layout.tsx` | 引入 `<VercelObservability />` |
| 修改 | `components/auth/auth-form.tsx` | Auth 事件 |
| 修改 | `components/chat/chat-app-shell.tsx` | 对话事件 |
| 新增 | `tests/unit/analytics/before-send.test.ts` | 单元测试 |
| 新增 | `tests/unit/analytics/events.test.ts` | noop 守卫测试 |
| 新增 | `docs/.../design/vercel-analytics*.md` | 模块设计 |

**不变:** Supabase、API routes、middleware、环境变量（Vercel 自动识别部署环境）。

---

## 10. 安全与降级

| 风险 | 缓解 |
|------|------|
| Query 参数泄露（`?next=`） | `beforeSend` 剥离 search/hash |
| 自定义事件含 PII | 仅事件名，无 payload |
| Analytics 脚本加载失败 | 不弹 UI；核心流程不受影响 |
| 开发环境污染 Dashboard | 官方包 + wrapper 在非 Vercel production 下 noop |
| RSC 向 Client 传函数 | `beforeSend` 放在 Client Component 内 |

---

## 11. 测试计划

### 11.1 自动化

| 类型 | 路径 | 覆盖 |
|------|------|------|
| 单元 | `tests/unit/analytics/before-send.test.ts` | AC-116 URL 脱敏 |
| 单元 | `tests/unit/analytics/events.test.ts` | AC-118 dev noop |
| 静态 | `pnpm build` | AC-117 layout + 依赖 |
| E2E | `tests/e2e/smoke.spec.ts` | 回归（不断言云端数据） |

### 11.2 手工 QA

- Vercel Dashboard：page view、Events、Speed Insights（changelog §12）
- Preview 部署 + 可选 `debug` prop 验证事件

### 11.3 本地验证

```bash
pnpm lint && pnpm build && pnpm test && CI=1 pnpm test:e2e
```

### 11.4 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| — | 否 | Vercel 注入部署上下文；无需新增 `.env` |

**运维（手工）:** 在 Vercel 项目 Settings 开启 Web Analytics 与 Speed Insights。

---

## 12. PRD 验收映射（必填）

| 验收标准 ID | 实现要点 | 验证方式 |
|-------------|----------|----------|
| AC-111 | 根 layout 经 `VercelObservability` 挂载 `<Analytics />` | manual — prod 部署后 Vercel Dashboard |
| AC-112 | 同组件挂载 `<SpeedInsights />` | manual — Speed Insights 仪表盘 |
| AC-113 | `signUp` 成功后 `trackProductEvent('sign_up_complete')`（含需邮箱确认分支） | manual / preview debug |
| AC-114 | `signInWithPassword` 成功后 `trackProductEvent('sign_in_complete')` | manual / preview debug |
| AC-115 | `createConversation` 返回 id 后 `trackProductEvent('conversation_started')` | manual / preview debug |
| AC-116 | `beforeSend` 调用 `redactAnalyticsEventUrl` | unit + manual |
| AC-117 | 依赖与 import 正确；build 通过 | static — `pnpm build` |
| AC-118 | `trackProductEvent` 在 `!isAnalyticsEnabled()` 时为 noop | unit；dev Network 手工 |

---

## 13. 开放问题 / 技术债

| ID | 问题 | 决议 |
|----|------|------|
| TD-01 | Preview 部署数据混入 Analytics | iter-11 接受；Dashboard 按 deployment 过滤 |
| TD-02 | Langfuse Agent 追踪 | 后续 feature；不在 iter-11 |
| TD-03 | Preview 临时开 `debug` | 可选 qa 手工步骤；prod layout 不带 debug |

---

## 14. 修订记录

| 日期 | 版本 | 迭代 | 变更 |
|------|------|------|------|
| 2026-07-02 | v0.1 | iter-11 | 初稿 |

---

*下一步:* 用户确认后 Phase B 编码 — 回复 `技术设计已确认，可开始编码`
