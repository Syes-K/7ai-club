# Console 壳

> **English:** [console-shell.md](./console-shell.md)  
> **中文：** [console-shell-cn.md](./console-shell-cn.md)  
> **总纲：** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **迭代：** iter-03

---

## 1. 路由

```
app/console/
  layout.tsx          # Server：鉴权，传 user 给 shell
  page.tsx            # 重定向 → /console/profile
  profile/page.tsx
  models/page.tsx     # 占位
  assistants/page.tsx
  knowledge/page.tsx  # 占位
  mcp/page.tsx        # 占位
```

`layout.tsx` 用 `ConsoleShell` + `SiteHeader`（`showChatLink`、`fullWidth`）包裹子页面。

---

## 2. Middleware

```typescript
// middleware.ts — matcher 增加
"/console/:path*"

if (pathname.startsWith("/console") && !user) {
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}
```

---

## 3. ConsoleShell 组件

```
components/console/console-shell.tsx   (client)
components/console/console-nav.tsx       (client)
components/console/placeholder-page.tsx  (占位共用)
```

### 3.1 侧栏菜单

| href | label | icon |
|------|-------|------|
| `/console/profile` | Profile | User |
| `/console/models` | Models | Cpu |
| `/console/assistants` | Assistants | Bot |
| `/console/knowledge` | Knowledge Base | BookOpen |
| `/console/mcp` | MCP | Plug |

- 当前项：`pathname.startsWith(href)` + neon 高亮
- 移动端：汉堡按钮 + 抽屉

### 3.2 布局

- 壳：`flex min-h-screen bg-[var(--bg-base)]`
- 侧栏：`w-56 border-r border-[var(--neon-primary)]/20 bg-[var(--bg-elevated)]`
- 主区：`flex-1 p-6 md:p-8`

---

## 4. 顶栏 / UserMenu

- `SiteHeader`：已登录显示 **Console** → `/console`
- `UserMenu`：增加 **Console** 菜单项；可选 `nickname` 用于展示名

---

## 5. 占位页组件

`PlaceholderPage({ title, description })` — 英文 + **Coming soon**。

---

## 6. 文件

| 操作 | 路径 |
|------|------|
| 新增 | `app/console/layout.tsx`、`page.tsx`、占位 `page.tsx` |
| 新增 | `components/console/console-shell.tsx` 等 |
| 修改 | `middleware.ts`、`site-header.tsx`、`user-menu.tsx` |

---

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 初稿 |
