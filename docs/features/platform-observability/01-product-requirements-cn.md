# 平台可观测性 — 产品需求总纲

> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文:** [01-product-requirements-cn.md](./01-product-requirements-cn.md)

> **项目:** 7ai-club  
> **Feature slug:** `platform-observability`  
> **迭代:** `iter-11`（见 [iter-11/README-cn.md](../../iterations/iter-11/README-cn.md)）  
> **路线图阶段:** 5 — 生产（可观测性基础）  
> **状态:** 已确认  
> **PRD 确认日期:** 2026-07-02  
> **文档版本:** v0.1

---

## 1. 执行摘要

为 7ai-club 集成 **Vercel Web Analytics** 与 **Speed Insights**，在 Vercel 部署环境下自动采集页面访问与 Core Web Vitals，并追踪少量关键产品事件（注册成功、登录成功、发起对话）。无用户可见 UI 变更；数据在 Vercel Dashboard 查看。本迭代为可观测性基础设施，不替代 Langfuse / Axiom 等 Agent 链路追踪。

---

## 2. 背景与目标

### 2.1 背景

- 项目已部署于 Vercel，架构 reference 将「可观测性方案」列为待决问题。
- 当前无页面级访问统计与前端性能指标，无法量化 Landing 转化与 Chat 使用。
- Vercel 原生 Analytics / Speed Insights 零 Cookie、匿名化，与 MVP 隐私预期一致。

### 2.2 目标

- 生产环境自动上报页面浏览与 Web Vitals。
- 追踪 3 个关键自定义事件，支撑漏斗分析（注册 → 登录 → 对话）。
- URL 上报前脱敏 query string，避免 `?next=` 等参数泄露。

### 2.3 非目标（Out of Scope）

- Langfuse / Axiom / OpenTelemetry 等后端或 Agent 链路追踪
- 应用内 Analytics Dashboard 或用户可见统计页
- Cookie 同意横幅（Vercel Analytics 不使用 Cookie；若未来引入 GA 等另立迭代）
- A/B 测试、Feature Flags 与 Analytics 联动
- 非 Vercel 部署环境（本地 / 自托管）的数据采集保证

---

## 3. 用户与场景

### 3.1 目标用户

| 角色 | 描述 |
|------|------|
| 产品 / 运营 | 在 Vercel Dashboard 查看访问量、热门路由、转化漏斗 |
| 开发 / 运维 | 在 Speed Insights 查看 LCP、FID、CLS 等，定位性能回归 |
| 终端用户 | 无感知；不增加 UI 或交互负担 |

### 3.2 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-01 | As a product owner, I want page view data in Vercel so that I can measure Landing and auth funnel traffic | P0 |
| US-02 | As a developer, I want Core Web Vitals in Speed Insights so that I can catch performance regressions before users complain | P0 |
| US-03 | As a product owner, I want custom events for sign-up and conversation start so that I can measure activation without building an internal dashboard | P0 |

---

## 4. 功能需求

### 4.1 功能列表

| ID | 功能 | 说明 | 优先级 |
|----|------|------|--------|
| F-01 | Web Analytics 集成 | `@vercel/analytics` + 根 layout `<Analytics />` | P0 |
| F-02 | Speed Insights 集成 | `@vercel/speed-insights` + 根 layout `<SpeedInsights />` | P0 |
| F-03 | URL 脱敏 | `beforeSend` 剥离 query string | P0 |
| F-04 | 自定义事件 | `sign_up_complete`、`sign_in_complete`、`conversation_started` | P0 |
| F-05 | 环境行为 | 生产上报；本地 / 非 Vercel 预览不发送或静默 noop | P0 |
| F-06 | Dashboard 启用说明 | 文档记录 Vercel 项目侧开启 Analytics / Speed Insights 步骤 | P1 |

### 4.2 详细说明

子能力详见 [prd/vercel-analytics-cn.md](./prd/vercel-analytics-cn.md)。

---

## 5. 页面与交互

**无用户可见 UI 变更。** 集成仅影响根 layout 与少量客户端 success 回调。

| 路径 | 追踪方式 |
|------|----------|
| `/` | 自动 page view |
| `/login`、`/register` | 自动 page view + 成功时 custom event |
| `/chat`、`/chat/[id]` | 自动 page view + 新建对话时 custom event |
| `/console/**` | 自动 page view |

---

## 6. 权限与安全（产品层）

| 操作 | 谁可以 | 备注 |
|------|--------|------|
| 查看 Analytics 数据 | Vercel 项目成员 | Dashboard 权限，非应用内 |
| 触发 page view / event | 所有访问者 | 匿名；不含 PII |
| 自定义事件 payload | 禁止含 email、user id、消息内容 | 仅事件名 + 可选非敏感 label |

---

## 7. 非功能需求

| 类型 | 要求 |
|------|------|
| 性能 | Analytics / Speed Insights 脚本异步加载，不阻塞首屏交互 |
| 隐私 | 遵循 Vercel 默认匿名化；`beforeSend` 移除 URL query |
| 可用性 | 采集失败不影响登录、聊天等核心功能 |
| 合规 | 不在事件中发送用户可识别信息 |

---

## 8. 验收标准

- [ ] AC-01：生产部署后，Vercel Web Analytics 仪表盘可见页面浏览（含 `/`、`/login`、`/chat`）
- [ ] AC-02：Speed Insights 仪表盘可见至少一条 Web Vitals 样本（部署后 24h 内或 staging 验证）
- [ ] AC-03：成功注册后上报 `sign_up_complete` 自定义事件（Vercel Events 或 debug 模式可验证）
- [ ] AC-04：成功登录后上报 `sign_in_complete`
- [ ] AC-05：用户通过助手选择器创建新对话成功后上报 `conversation_started`
- [ ] AC-06：上报 URL 不含 query string（如 `/login` 而非 `/login?next=%2Fchat`）
- [ ] AC-07：`pnpm build` 通过；Analytics 组件不导致 SSR / hydration 错误
- [ ] AC-08：本地 `pnpm dev` 不向生产 Analytics 端点发送数据（或仅 debug 可观测）

---

## 9. 依赖与假设

### 9.1 依赖

- 项目部署在 Vercel 且已关联正确 project
- Vercel Dashboard 中手动启用 Web Analytics 与 Speed Insights（Hobby 含基础额度）

### 9.2 假设

- 团队有 Vercel 项目访问权限查看仪表盘
- 本迭代不要求 E2E 断言 Vercel 云端数据（以 build + 可选 debug 模式 / 手工 Dashboard 验证为主）

---

## 10. 开放问题

| ID | 问题 | 状态 | 决议 |
|----|------|------|------|
| OQ-01 | 是否同时集成 Speed Insights | 已决 | 是（iter-11） |
| OQ-02 | 自定义事件范围 | 已决 | 3 个基础事件 |
| OQ-03 | 是否排除 /console、/chat 路径 | 已决 | 否；全站追踪 + query 脱敏 |
| OQ-04 | 是否在 auth 事件中带 `method: email` 等维度 | 开放 | 默认仅事件名，无 payload |

---

## 11. 文档地图

| 子能力 | PRD | 设计（Phase A） |
|--------|-----|-----------------|
| Vercel Analytics + Speed Insights | [prd/vercel-analytics-cn.md](./prd/vercel-analytics-cn.md) | [design/vercel-analytics-cn.md](./design/vercel-analytics-cn.md)（待 fullstack-developer） |

**本迭代 changelog:** [changelog/iter-11-cn.md](./changelog/iter-11-cn.md)

---

## 12. 修订记录

| 日期 | 版本 | 迭代 | 变更 |
|------|------|------|------|
| 2026-07-02 | v0.1 | iter-11 | 初稿 |

---

*迭代索引:* `docs/iterations/iter-11/README-cn.md`  
*下一文档:* `02-technical-design-cn.md`（由 fullstack-developer 产出）
