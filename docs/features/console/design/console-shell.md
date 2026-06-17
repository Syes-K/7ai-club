# Console Shell

> **English:** [console-shell.md](./console-shell.md)  
> **中文：** [console-shell-cn.md](./console-shell-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **Iteration:** iter-03

---

## 1. Routes

```
app/console/
  layout.tsx          # Server: auth check, pass user to shell
  page.tsx            # redirect → /console/profile
  profile/page.tsx
  models/page.tsx     # placeholder
  assistants/page.tsx
  knowledge/page.tsx  # placeholder
  mcp/page.tsx        # placeholder
```

`layout.tsx` wraps children in `ConsoleShell` + `SiteHeader` (`showChatLink`, `fullWidth`).

---

## 2. Middleware

```typescript
// middleware.ts — add to matcher
"/console/:path*"

if (pathname.startsWith("/console") && !user) {
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}
```

---

## 3. ConsoleShell Component

```
components/console/console-shell.tsx   (client)
components/console/console-nav.tsx       (client)
components/console/placeholder-page.tsx  (shared stub)
```

### 3.1 Props

```typescript
interface ConsoleShellProps {
  children: React.ReactNode;
  user: User;
}
```

### 3.2 Sidebar nav items

| href | label | icon (lucide) |
|------|-------|---------------|
| `/console/profile` | Profile | User |
| `/console/models` | Models | Cpu |
| `/console/assistants` | Assistants | Bot |
| `/console/knowledge` | Knowledge Base | BookOpen |
| `/console/mcp` | MCP | Plug |

- Active: `pathname.startsWith(href)` + neon border/background
- Mobile: hamburger toggles drawer overlay

### 3.3 Layout CSS

- Shell: `flex min-h-screen bg-[var(--bg-base)]`
- Sidebar: `w-56 border-r border-[var(--neon-primary)]/20 bg-[var(--bg-elevated)]`
- Main: `flex-1 p-6 md:p-8`

---

## 4. Header / UserMenu

**`site-header.tsx`:**

- Add optional `showConsoleLink?: boolean` (default true when user)
- Link: `/console` label **Console**

**`user-menu.tsx`:**

- Add menuitem **Console** → `/console` (above Sign out)
- Accept optional `nickname?: string | null` for display label

---

## 5. Placeholder Page

`PlaceholderPage({ title, description })` — English copy, **Coming soon** badge.

---

## 6. Files

| Action | Path |
|--------|------|
| Add | `app/console/layout.tsx`, `page.tsx`, `models/page.tsx`, `knowledge/page.tsx`, `mcp/page.tsx` |
| Add | `components/console/console-shell.tsx`, `console-nav.tsx`, `placeholder-page.tsx` |
| Mod | `middleware.ts`, `site-header.tsx`, `user-menu.tsx` |

---

## 7. Revision History

| Date | Change |
|------|--------|
| 2026-06-16 | Initial |
