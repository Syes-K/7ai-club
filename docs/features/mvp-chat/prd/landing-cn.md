# 营销首页 · 顶栏 · 视觉（C2）

> **English:** [landing.md](./landing.md)  
> **中文：** [landing-cn.md](./landing-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-02

---

## 1. 范围

F-10 营销首页、F-11 全局顶栏与用户展示、C2 · Electric Ocean 视觉 token（首页与 Chat 共用）。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-06 | 访客在首页了解产品 | P0 |
| US-07 | 首页/顶栏一键进入 Chat | P0 |
| US-08 | 已登录用户右上角看到账号 | P0 |

---

## 3. F-10 营销首页

**`/ ` 为公开 Landing，不自动 redirect 至 `/chat`（已登录亦然）。**

内容结构参考 [7ai.club/en](https://7ai.club/en)（English UI）：

| 模块 | 要点 |
|------|------|
| 顶栏 | Logo、Chat、Sign in/Register 或用户区 |
| Hero | 主标题、副标语、价值主张 |
| CTA | **Start chat** — 未登录 → `/login?next=/chat`；已登录 → `/chat` |
| 能力 `[01]`–`[04]` | Streaming & models、Prompts & configs、Knowledge & routing、Assistant & personas（后两项可为 roadmap） |
| 页脚 | 学习模式说明；备案/联系可选 |

**边界：** Open console 不实现 — 隐藏或 Coming soon。

---

## 4. F-11 顶栏与用户

- 首页与 Chat 共享 header（或视觉一致组件）
- 已登录：**头像 + 下拉**（完整邮箱、Sign out）；首页/Chat `compactUserMenu`
- 未登录：Sign in、Register

---

## 5. 视觉 — C2 · Electric Ocean（已确认）

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-base` | `#0A0E27` | 页面背景 |
| `--bg-elevated` | `#12183A` | 卡片、侧边栏 |
| `--neon-primary` | `#0080FF` | 边框、链接、focus |
| `--neon-secondary` | `#BF00FF` | 渐变、强调 |
| `--accent-success` | `#22C55E` | CTA、AI 标识 |
| `--text-primary` | `#F8FAFC` | 正文 |
| `--text-muted` | `#94A3B8` | 次要 |

**风格：** Retro Cyber / Synthwave — 低 opacity 网格、neon hover、`[01]` 编号模块、尊重 `prefers-reduced-motion`。

**字体：** JetBrains Mono / Space Mono（标题）；Inter（正文）。

**参考：** [vercel.com](https://vercel.com)、[railway.app](https://railway.app)、[7ai.club/en](https://7ai.club/en)（结构）

---

## 6. 验收标准

- [x] **AC-10**：`/` 展示 Landing，不 auto-redirect
- [x] **AC-11**：Start chat 路径正确（guest → login；authed → chat）
- [x] **AC-12**：顶栏 Chat 链接有效
- [x] **AC-13**：右上角用户标识（头像下拉）
- [x] **AC-18**：首页与 Chat C2 视觉一致

---

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-15 | iter-02 从总纲拆出 |
| 2026-06-16 | 本地实现完成；compact 用户菜单 |
