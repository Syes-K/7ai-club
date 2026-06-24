# Console Shell

> **English:** [console-shell.md](./console-shell.md)  
> **中文：** [console-shell-cn.md](./console-shell-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **Iteration:** iter-03 · **iter-05** (busy loading, `ConsolePage`)

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

## 8. Async / busy loading (iter-05)

> **Global spec:** [loading-ux.md](../../../loading-ux.md) · [loading-ux-cn.md](../../../loading-ux-cn.md)  
> Console-specific components below. Chat patterns: [chat-integration.md](./chat-integration.md) §6.

### 8.1 Console levels (summary)

| Level | When | Components |
|-------|------|------------|
| **Route initial (RSC)** | `page.tsx` async fetch | `app/console/<route>/loading.tsx` + `ConsolePageLoading` |
| **Route initial (client)** | Mount `useEffect` fetch | `usePageBusy` on mount |
| **Page** | List CRUD + header CTA | `ConsolePage` + `usePageBusy` |
| **Section** | Multi-card independent save | `ConsoleSection` |
| **Action-only** | **Avoid** for mutations |
| **Global overlay** | **Not** for Console mutations |

See global doc §3 decision tree for new actions.

### 8.2 Files

```
components/console/console-page.tsx
components/console/console-section.tsx
components/console/console-busy-overlay.tsx
components/console/console-page-loading.tsx      # RSC loading.tsx
components/console/use-page-busy.ts
app/console/models/loading.tsx
app/console/profile/loading.tsx
```

### 8.3 Behavior

- While `busy`: content `pointer-events-none`, overlay with English label (`aria-busy`, `role="status"`).
- Header CTA and row actions disabled when `busy`; `if (busy) return` before dialogs.
- One mutation per page — `runBusy("Testing model…", async () => { api + refresh })`.
- Dialog submit: page busy underneath; dialog buttons show **Saving…** / **Deleting…**.

### 8.4 Adoption

| Surface | Initial | Mutations |
|---------|---------|-----------|
| `ModelsManager` | `loading.tsx` (RSC) | Page busy |
| `AssistantsManager` | `runBusy` on mount | Page busy |
| `AccountCard` / `PreferencesCard` | `loading.tsx` (RSC) | Section busy |

New Console list pages: **page busy (C)** by default; RSC routes add **`loading.tsx` (A)**.

---

## 9. Files

| Action | Path |
|--------|------|
| Add | `app/console/layout.tsx`, `page.tsx`, `models/page.tsx`, `knowledge/page.tsx`, `mcp/page.tsx` |
| Add | `components/console/console-shell.tsx`, `console-nav.tsx`, `placeholder-page.tsx` |
| Add (iter-05) | `console-page.tsx`, `console-section.tsx`, `console-busy-overlay.tsx`, `console-page-loading.tsx`, `use-page-busy.ts` |
| Add (iter-05) | `app/console/models/loading.tsx`, `app/console/profile/loading.tsx` |
| Mod | `middleware.ts`, `site-header.tsx`, `user-menu.tsx` |

---

## 10. Revision History

| Date | Change |
|------|--------|
| 2026-06-16 | Initial |
| 2026-06-17 | §8 async / busy loading (iter-05); `ConsolePage` / `ConsoleSection` |
| 2026-06-17 | §8 → global [loading-ux.md](../../../loading-ux.md); RSC `loading.tsx` |
