# Console Shell & Placeholders

> **English:** [placeholders.md](./placeholders.md)  
> **中文：** [placeholders-cn.md](./placeholders-cn.md)  
> **Index:** [01-product-requirements.md](../01-product-requirements.md)  
> **Iteration:** iter-03

---

## 1. Scope

F-20 — Console layout, sidebar, auth gate, placeholder pages, C2 visual, navigation entries.

---

## 2. F-20 Console Shell

### 2.1 Layout

- Left sidebar (desktop); collapsible drawer on small screens
- Main content area with page title
- Shared top bar: brand, **Chat**, user menu (same `SiteHeader` patterns)
- `/console` → redirect `/console/profile`

### 2.2 Sidebar items (order)

1. Profile  
2. Models  
3. Assistants  
4. Knowledge Base  
5. MCP  

Active route highlighted (neon accent).

### 2.3 Auth

- Unauthenticated `/console/*` → `/login?next=<path>`
- `middleware` matcher includes `/console/:path*`

### 2.4 Entry points

- Header link **Console** (signed-in)
- UserMenu item **Console**

---

## 3. Placeholder Pages

| Route | Title | Body (English) |
|-------|-------|----------------|
| `/console/models` | Model management | Short description + **Coming soon** |
| `/console/knowledge` | Knowledge Base | Short description + **Coming soon** |
| `/console/mcp` | MCP | Short description + **Coming soon** |

No forms or API calls on placeholders.

---

## 4. Visual

Reuse C2 tokens from `app/globals.css` (`--bg-base`, `--neon-primary`, etc.) — same as landing/chat.

---

## 5. Acceptance Criteria

- [ ] **AC-01** — Auth redirect for `/console/*`
- [ ] **AC-02** — Header + UserMenu Console entry
- [ ] **AC-03** — Sidebar 5 items, active state, mobile usable
- [ ] **AC-11** — Placeholder pages render without error
- [ ] **AC-12** — C2 visual; English copy

---

## 6. Revision History

| Date | Change |
|------|--------|
| 2026-06-16 | Initial |
