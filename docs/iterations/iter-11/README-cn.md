# iter-11 — Vercel Analytics 与 Speed Insights

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **迭代 ID:** `iter-11`  
> **状态:** **已发布**  
> **路线图阶段:** 5 — 生产（可观测性基础）  
> **计划发布:** 2026-07-04  
> **实际发布:** 2026-07-03  
> **Git tag（可选）:** `iter-11`  
> **前置:** [iter-10](../iter-10/README-cn.md) **已发布**

---

## 1. 迭代目标

- [x] 根 layout 集成 Vercel Web Analytics 与 Speed Insights
- [x] 追踪 3 个自定义事件：注册、登录、发起对话
- [x] `beforeSend` 脱敏 URL query；开发环境不上报
- [x] QA C0–C4 验收通过并发布

---

## 2. 范围

### In Scope

| 区域 | 变更摘要 |
|------|----------|
| **依赖** | `@vercel/analytics`、`@vercel/speed-insights` |
| **Layout** | `app/layout.tsx` 挂载 Analytics + SpeedInsights |
| **隐私** | page view URL 剥离 query string |
| **事件** | Auth 成功回调 + 新建对话客户端埋点 |
| **测试** | `tests/unit/analytics/`（12 cases） |
| **文档** | Feature PRD、changelog、Dashboard 开启说明 |

### Out of Scope

- Langfuse / Axiom / Agent workflow 链路追踪
- 应用内 Analytics 页面
- Cookie 同意横幅
- 每条 chat message 埋点
- Console CRUD 事件

---

## 3. 包含的 Features

| Slug | Changelog | 状态 |
|------|-----------|------|
| `platform-observability` | [changelog/iter-11-cn.md](../../features/platform-observability/changelog/iter-11-cn.md) | **已发布** |

---

## 4. 验收

### 4.1 自动化（qa Phase C2）

- [x] `pnpm lint` — 2026-07-03
- [x] `pnpm build` — 2026-07-03
- [x] `pnpm test` — 139 passed
- [x] `pnpm test:e2e` — `CI=1`；24 passed，1 flaky iter04（非阻塞）

### 4.2 手工 QA（qa Phase C0 + C3）

- [x] changelog **§5.1 Test Matrix** 已填写（C0 · 2026-07-03）
- [x] changelog **§12 Manual Script** 已执行（C3 · 2026-07-03）
- [x] AC-111–118 — changelog §5 已全部勾选

### 4.3 发布

- [x] changelog §5 AC 已全部勾选（qa-engineer · 2026-07-03）
- [x] 用户确认：`测试已通过，可发布`（2026-07-03）

---

## 5. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | iter-10 已发布；Vercel 项目需开启 Analytics / Speed Insights |
| 已缓解 | 代码 + 单元测试覆盖；Dashboard 数据待 prod 部署后 M-02/M-03 补截图 |
| 遗留 | iter04 AC-30 E2E flaky（非本迭代引入） |

---

## 6. 门禁记录

| 日期 | 事件 |
|------|------|
| 2026-07-02 | iter-11 立项；PRD + 技术设计 + Phase B |
| 2026-07-03 | qa C0–C4：AC-111–118 全部勾选；139 unit + e2e 通过 |
| 2026-07-03 | 用户确认发布；**迭代已发布** |

---

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-02 | 创建 iter-11 |
| 2026-07-03 | QA 验收通过；标 **待发布确认** |
| 2026-07-03 | 用户确认；标 **已发布** |
