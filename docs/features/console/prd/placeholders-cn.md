# Console 壳与占位页

> **English:** [placeholders.md](./placeholders.md)  
> **中文：** [placeholders-cn.md](./placeholders-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-03

---

## 1. 范围

F-20 — Console 布局、侧栏、鉴权、占位页、C2 视觉、导航入口。

---

## 2. F-20 Console 壳

### 2.1 布局

- 左侧菜单（桌面）；小屏可折叠抽屉
- 主内容区 + 页面标题
- 共用顶栏：品牌、**Chat**、用户菜单（沿用 `SiteHeader`）
- `/console` → 重定向 `/console/profile`

### 2.2 侧栏顺序

1. Profile
2. Models
3. Assistants
4. Knowledge Base
5. MCP

当前路由高亮（neon 强调色）。

### 2.3 鉴权

- 未登录访问 `/console/`* → `/login?next=<path>`
- `middleware` matcher 包含 `/console/:path*`

### 2.4 入口

- 顶栏 **Console**（已登录）
- UserMenu **Console**

---

## 3. 占位页

> **iter-05：** `/console/models` 已迁 [models-cn.md](./models-cn.md)（F-24），**不再**为占位页。


| 路由                   | 标题             | 正文（English）            |
| -------------------- | -------------- | ---------------------- |
| `/console/knowledge` | Knowledge Base | 简短说明 + **Coming soon** |
| `/console/mcp`       | MCP            | 简短说明 + **Coming soon** |


占位页无表单、无 API。

---

## 4. 视觉

复用 `app/globals.css` C2 tokens（`--bg-base`、`--neon-primary` 等），与首页/聊天一致。

---

## 5. 验收标准

- [x] **AC-01** — `/console/`* 未登录重定向
- [x] **AC-02** — 顶栏 + UserMenu Console 入口
- [x] **AC-03** — 侧栏 5 项、高亮、移动端可用
- [x] **AC-11** — 占位页正常渲染
- [x] **AC-12** — C2 视觉；英文文案

---

## 6. 修订记录


| 日期         | 变更  |
| ---------- | --- |
| 2026-06-16 | 初稿  |


