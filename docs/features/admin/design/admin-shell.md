# Admin Shell — Technical Design

> **English:** [admin-shell.md](./admin-shell.md)  
> **中文:** [admin-shell-cn.md](./admin-shell-cn.md)  
> **Index:** [02-technical-design.md](../02-technical-design.md)  
> **Iteration:** iter-12

---

## 1. Route tree

```
app/admin/
  layout.tsx          # getAdminUser + AdminShell
  page.tsx            # redirect → /admin/users
  forbidden/page.tsx
  users/page.tsx
  models/page.tsx
  assistants/page.tsx
```

---

## 2. Component tree

```
AdminShell (mirrors ConsoleShell)
├── SiteHeader (showAdminLink=false, showConsoleLink, showChatLink)
├── AdminNav
│   ├── Users
│   ├── Models
│   └── Assistants
└── main {children}

components/admin/
  admin-shell.tsx
  admin-nav.tsx
  admin-page.tsx          # title + optional loading
  users-manager.tsx
  platform-models-manager.tsx   # mirrors ModelsManager
  platform-assistants-manager.tsx # mirrors AssistantsManager
```

**Visual:** Reuse `GridBackground`, Console sidebar width and active styles; page titles in English.

---

## 3. Data flow

| Page | Data fetch |
|------|------------|
| Users | Client → `fetch("/api/admin/users?page=&q=")` |
| Models | Client → `/api/admin/models` CRUD |
| Assistants | Client → `/api/admin/assistants` CRUD |

Admin pages **force-dynamic**; same as Console.

---

## 4. File list

| Action | Path |
|--------|------|
| Add | `app/admin/**` |
| Add | `components/admin/**` |

---

## 5. AC mapping

| AC | Notes |
|----|-------|
| AC-120–124 | Users page |
| AC-127–128 | Models page |
| AC-134 | Assistants page |
