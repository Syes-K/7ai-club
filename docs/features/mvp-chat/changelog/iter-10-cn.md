# iter-10 变更摘要 — mvp-chat（Landing · Auth · Assistant picker）

> **English:** [iter-10.md](./iter-10.md)  
> **中文：** [iter-10-cn.md](./iter-10-cn.md)  
> **迭代索引：** [iter-10/README-cn.md](../../iterations/iter-10/README-cn.md)

---

## 1. 主题

| 主题 | PRD | 设计 |
|------|-----|------|
| Landing 布局与能力区 | [prd/landing-cn.md](../prd/landing-cn.md) §3.3 iter-10 | [design/landing-cn.md](../design/landing-cn.md) |
| 顶栏与用户菜单 | [prd/landing-cn.md](../prd/landing-cn.md) §3.4 iter-10 | — |
| 助手选择弹窗 | [prd/core-chat-cn.md](../prd/core-chat-cn.md) §3.3 iter-10 | — |

**跨 feature：** Auth `?next=` 见 [console](../../console/README-cn.md)（无 UI 变更）

---

## 2. 必读

1. [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
2. [changelog/iter-02-cn.md](./iter-02-cn.md) — iter-02 Landing 基线  
3. [iter-10/README-cn.md](../../iterations/iter-10/README-cn.md)

---

## 3. 计划交付（编码前）

| 区域 | 路径 / 说明 |
|------|-------------|
| Landing 布局 | `app/page.tsx` · `landingMainContentClass` |
| Landing 组件 | `components/landing/*` · `lib/constants/landing*.ts` |
| Header | `components/layout/site-header.tsx` · `user-menu.tsx` |
| Auth | `components/auth/auth-form.tsx` |
| Assistant picker | `components/chat/assistant-picker-dialog.tsx` |
| Console deep link | `app/console/assistants/page.tsx` · `assistants-manager.tsx` |

### 3.1 实际交付（Phase B）

| ID | 项 | 路径 |
|----|-----|------|
| L-01 | Header **fullWidth**（与 Chat/Console 一致） | `app/page.tsx` · `site-header.tsx` |
| L-02 | Hero + 能力区 **一体** `flex-1 justify-center`；Footer `mt-auto` 贴底 | `landing-layout.ts` · `landing-hero.tsx` · `capability-grid.tsx` · `landing-footer.tsx` |
| L-03 | 能力区 6 项（含 MCP roadmap）；字体 **12px**；卡片 min-height 大屏加大 | `landing.ts` · `capability-grid.tsx` |
| L-04 | Landing 顶栏：无 Chat；未登录仅 **Sign in**（LogIn icon）；Console 仅 UserMenu | `site-header.tsx` · `app/page.tsx` |
| L-05 | UserMenu 去掉「Signed in as」；仅显示昵称/邮箱 | `user-menu.tsx` |
| L-06 | Auth 切换 Sign up / Sign in 保留 `?next=` | `auth-form.tsx` |
| L-07 | 助手弹窗 **Manage assistants**（副标题行右，底对齐） | `assistant-picker-dialog.tsx` |
| L-08 | 空助手列表 → `/console/assistants?create=1` 自动开 Create | `assistants/page.tsx` · `assistants-manager.tsx` |

---

## 4. 产品决策记录（iter-10 已确认）

| 项 | 决策 |
|----|------|
| Hero 与能力区 | **作为一块** 在 header/footer 间垂直居中，不再单独给 Hero `min-h` 挤占能力区 |
| Header 宽度 | Landing 与 Chat/Console 同为 **全宽 bar + px-4/md:px-6** |
| Register | 不在顶栏暴露；登录页底部 Sign up 切换 |
| Console 入口 | 仅 UserMenu 下拉，不在 Landing 顶栏 / Hero 放 Open console |
| Manage vs Add | 弹窗用 **Manage assistants** 跳转 Console；不在 Chat 内嵌创建表单 |
| 能力区字号 | 统一 `text-xs`（12px），各断点不放大 |

---

## 5. 验收清单

> **勾选规则：** 仅 **qa-engineer** Phase C4 勾选。

### 摘要（AC 一览）

- [x] **AC-101** — Landing 纵向布局：Footer 贴底，Hero+能力区一体居中
- [x] **AC-102** — Landing 能力区 6 项、12px、链接正确
- [x] **AC-103** — Landing Header 全宽；无 Chat/Register；Sign in + UserMenu
- [x] **AC-104** — Auth 切换保留 `?next=` 参数
- [x] **AC-105** — 助手选择弹窗 Manage link + `?create=1` deep link

### 5.1 Test Matrix（qa-engineer · Phase C0）

| AC ID | 前提 | 操作步骤 | 期望结果 | 验证方式 | 自动化覆盖 | 证据（qa 填写） |
|-------|------|----------|----------|----------|------------|-----------------|
| AC-101 | 浏览器 ≥1280px 高 | 1. 打开 `/` 2. 观察 Hero、能力区、Footer | Footer `SYS://local…` 在视口底；Hero 与 6 卡片作为整体居中，能力区不被压扁 | e2e + manual | `iter10-polish` AC-101 · smoke | pass · 2026-07-03 |
| AC-102 | `/` | 1. 数能力卡片 2. 检查 `[01]`–`[06]` 文案与链接 | 6 项；`[01][04]`→`/chat`；`[02]`→knowledge；`[03]`→assistants；`[05]`→models；`[06]` 无链接 | e2e | `iter10-polish` AC-102 | pass · 2026-07-03 |
| AC-103 | 未登录 / 已登录各测一次 | 1. `/` 顶栏 2. 已登录看 UserMenu | 无 Chat、无 Register；Sign in 带 icon；Console 仅在头像菜单 | e2e + manual | `iter10-polish` AC-103（header exact Chat） | pass · 2026-07-03 |
| AC-104 | — | 1. `/login?next=/chat` 2. 点 Sign up | URL 含 `next=%2Fchat` | e2e | `iter10-polish` AC-104 | pass · 2026-07-03 |
| AC-105 | 已登录 ≥1 assistant | 1. New chat 2. 见 Manage assistants 3. 点击 | 跳转 `/console/assistants`；副标题与 link 底对齐 | e2e + manual | `iter10-polish` AC-105 · AC-110b | pass · 2026-07-03 |
| AC-105b | 0 assistant（可选） | 1. 空列表文案链接 | 打开 `/console/assistants?create=1` 且 Create dialog 自动打开 | manual | `iter10-polish` AC-110b | pass · deep link |

---

## 6. 门禁与阶段状态

| 阶段 | 确认话术 / 状态 | 日期 |
|------|-----------------|------|
| PRD 增量 | iter-10 §4 决策已记录 | 2026-07-02 |
| 编码 | Phase B 交付 | 2026-07-02 |
| 测试 C0 | Test Matrix + §12 已落盘 | 2026-07-02 |
| 测试 C1–C3 | 自动化 + 手工通过 | 2026-07-03 |
| 发布 | **已发布**（用户：`测试已通过，可发布`） | 2026-07-03 |

---

## 12. 手工 QA 脚本

| # | 映射 AC | 场景 | 前提 | 步骤 | 期望 | 结果 | 证据 |
|---|---------|------|------|------|------|------|------|
| M-101 | AC-101 | 大屏纵向平衡 | 1440×900+ | 1. `/` 2. 目测 Hero/Grid/Footer | Footer 贴底；中间内容均衡 | pass | e2e AC-101 |
| M-102 | AC-103 | 已登录壳层 | 测试账号 | 1. `/` 2. 点头像 3. Console | 顶栏无 Console 文字链；菜单有 Console | pass | e2e AC-103 |
| M-103 | AC-105 | Manage 对齐 | New chat 弹窗 | 1. 打开 picker 2. 对比副标题与 Manage 行 | 文字底对齐 | pass | 编码 `items-end` |

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-02 | 创建 iter-10 mvp-chat changelog |
| 2026-07-03 | QA C4：AC-101–105 勾选；§12 执行完成 |
