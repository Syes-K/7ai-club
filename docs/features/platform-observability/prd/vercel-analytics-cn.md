# Vercel Analytics 与 Speed Insights

> **English:** [vercel-analytics.md](./vercel-analytics.md)  
> **中文:** [vercel-analytics-cn.md](./vercel-analytics-cn.md)

> **Feature:** `platform-observability`  
> **迭代:** `iter-11`  
> **优先级:** P0

---

## 1. 描述

在 Next.js App Router 根 layout 集成 Vercel 官方 npm 包，实现零配置页面浏览追踪、Core Web Vitals 采集，并在关键产品动作处调用 `track()` 上报自定义事件。

---

## 2. 包与组件

| 包 | 组件 | 位置 |
|----|------|------|
| `@vercel/analytics` | `<Analytics />` from `@vercel/analytics/next` | `app/layout.tsx` |
| `@vercel/speed-insights` | `<SpeedInsights />` from `@vercel/speed-insights/next` | `app/layout.tsx` |

两个组件置于 `<body>` 内、`{children}` 之后，与 Vercel 官方 quickstart 一致。

---

## 3. URL 脱敏（beforeSend）

**规则：** 所有 page view 事件在发送前将 `event.url` 的 query string 移除。

**示例：**

| 实际 URL | 上报 URL |
|----------|----------|
| `/login?next=%2Fchat` | `/login` |
| `/chat/abc-123?assistant=xyz` | `/chat/abc-123` |

**实现约束：**

- 使用 `URL` API 或等效方式解析 pathname，保留 pathname，丢弃 search/hash
- 不修改 pathname 本身（不过滤 `/console` 或 `/chat`）
- 若解析失败，丢弃该事件（返回 `null`）而非发送原始 URL

---

## 4. 自定义事件

使用 `@vercel/analytics` 的 `track(eventName)`。**禁止** 在第二个参数中传递 email、user id、对话内容、API key 等 PII。

| 事件名 | 触发时机 | 代码位置（计划） |
|--------|----------|------------------|
| `sign_up_complete` | Supabase `signUp` 成功且无 error | `components/auth/auth-form.tsx` |
| `sign_in_complete` | Supabase `signInWithPassword` 成功 | `components/auth/auth-form.tsx` |
| `conversation_started` | `createConversation(assistantId)` 成功返回 conversation id | `components/chat/chat-app-shell.tsx`（或封装层） |

**不追踪：**

- 登录/注册失败（避免暴力枚举噪声）
- 每条 chat message（Out of Scope）
- Console CRUD 操作（Out of Scope）

---

## 5. 环境行为

| 环境 | 行为 |
|------|------|
| Vercel Production | 正常上报 |
| Vercel Preview | 正常上报（可选：与 prod 共用 project 时在 Dashboard 按 deployment 过滤） |
| `pnpm dev` (localhost) | 不发送网络请求；`track()` 为 noop 或通过 `process.env.NODE_ENV === 'development'` 短路 |
| `pnpm build` + `pnpm start` 本地 | 与 dev 相同，不上报（无 `VERCEL` env） |

**验证：** 开发环境可在浏览器 Network 面板确认无 `vitals.vercel-insights.com` / analytics 相关请求。

---

## 6. Vercel Dashboard 配置（运维）

编码交付后，项目维护者须在 Vercel 项目设置中：

1. **Analytics → Web Analytics → Enable**
2. **Speed Insights → Enable**
3. 部署含新依赖的版本到 Production
4. 等待数据流入（通常数分钟至数小时）

此步骤写入 changelog §12 Manual Script，非应用代码。

---

## 7. 边界与异常

| 场景 | 期望 |
|------|------|
| Analytics 脚本加载失败 | 用户功能正常；无 toast / 错误 UI |
| `track()` 在 SSR 调用 | 禁止；仅在 Client Component 成功回调中调用 |
| 用户未确认邮箱即 signUp 返回 session | 仍计 `sign_up_complete`（Supabase 返回 success） |
| 重复登录 | 每次成功登录计一次 `sign_in_complete`（可接受噪声） |

---

## 8. 验收标准（本子文档）

- [ ] AC-101：根 layout 含 `<Analytics beforeSend={...} />` 与 `<SpeedInsights />`
- [ ] AC-102：三个 `track()` 调用点与上表一致
- [ ] AC-103：单元测试覆盖 URL 脱敏 helper（纯函数）
- [ ] AC-104：开发环境不发送 analytics 请求（manual 或 static 验证）

---

## 9. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-02 | iter-11 初稿 |
