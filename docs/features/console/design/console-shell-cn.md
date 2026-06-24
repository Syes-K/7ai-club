# Console 壳

> **English:** [console-shell.md](./console-shell.md)  
> **中文：** [console-shell-cn.md](./console-shell-cn.md)  
> **总纲：** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **迭代：** iter-03 · **iter-05**（busy loading、`ConsolePage`）

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

## 8. 异步 / busy loading（iter-05）

> **全局规范：** [loading-ux-cn.md](../../../loading-ux-cn.md) · [loading-ux.md](../../../loading-ux.md)  
> 下文为 Console 组件索引。Chat 见 [chat-integration-cn.md](./chat-integration-cn.md) §6。

### 8.1 Console 层级（摘要）

| 层级 | 场景 | 组件 |
|------|------|------|
| **路由首屏（RSC）** | `page.tsx` async | `app/console/<route>/loading.tsx` + `ConsolePageLoading` |
| **路由首屏（客户端）** | mount `useEffect` | mount 时 `usePageBusy` |
| **页面级** | 列表 CRUD + 页头 CTA | `ConsolePage` + `usePageBusy` |
| **区块级** | 多 Card 独立保存 | `ConsoleSection` |
| **仅 Action** | mutation **避免** |
| **全站遮罩** | Console mutation **不用** |

新 action 选型见全局文档 §3 决策树。

### 8.2 文件

```
components/console/console-page.tsx
components/console/console-section.tsx
components/console/console-busy-overlay.tsx
components/console/console-page-loading.tsx      # RSC loading.tsx
components/console/use-page-busy.ts
app/console/models/loading.tsx
app/console/profile/loading.tsx
```

### 8.3 行为

- `busy`：内容 `pointer-events-none`、遮罩 + 英文文案（`aria-busy`、`role="status"`）。
- `busy` 时禁用页头与行操作；打开 dialog 前 `if (busy) return`。
- 每页一个 mutation — `runBusy("Testing model…", async () => { API + 刷新 })`。
- Dialog 提交：页面保持 busy；dialog 内 **Saving…** / **Deleting…**。

### 8.4 采用

| 页面 | 首屏 | Mutation |
|------|------|----------|
| `ModelsManager` | `loading.tsx`（RSC） | 页面 busy |
| `AssistantsManager` | mount `runBusy` | 页面 busy |
| `AccountCard` / `PreferencesCard` | `loading.tsx`（RSC） | 区块 busy |

新增 Console 列表页默认 **页面 busy（C）**；RSC 路由须加 **`loading.tsx`（A）**。

---

## 9. 文件

| 操作 | 路径 |
|------|------|
| 新增 | `app/console/layout.tsx`、`page.tsx`、占位 `page.tsx` |
| 新增 | `components/console/console-shell.tsx` 等 |
| 新增（iter-05） | `console-page.tsx`、`console-section.tsx`、`console-busy-overlay.tsx`、`console-page-loading.tsx`、`use-page-busy.ts` |
| 新增（iter-05） | `app/console/models/loading.tsx`、`app/console/profile/loading.tsx` |
| 修改 | `middleware.ts`、`site-header.tsx`、`user-menu.tsx` |

---

## 10. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 初稿 |
| 2026-06-17 | §8 异步 / busy loading（iter-05）；`ConsolePage` / `ConsoleSection` |
| 2026-06-17 | §8 → 全局 [loading-ux-cn.md](../../../loading-ux-cn.md)；RSC `loading.tsx` |
