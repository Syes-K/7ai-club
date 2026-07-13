# Admin Shell — 技术设计

> **English:** [admin-shell.md](./admin-shell.md)  
> **中文:** [admin-shell-cn.md](./admin-shell-cn.md)  
> **总纲:** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **迭代:** iter-12

---

## 1. 路由树

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

## 2. 组件树

```
AdminShell (参考 ConsoleShell)
├── SiteHeader (showAdminLink=false, showConsoleLink, showChatLink)
├── AdminNav
│   ├── Users
│   ├── Models
│   └── Assistants
└── main {children}

components/admin/
  admin-shell.tsx
  admin-nav.tsx
  admin-page.tsx          # 标题 + 可选 loading
  users-manager.tsx
  platform-models-manager.tsx   # 参考 ModelsManager
  platform-assistants-manager.tsx # 参考 AssistantsManager
```

**视觉：** 复用 `GridBackground`、Console 侧栏宽度与 active 样式；页面标题 English。

---

## 3. 数据流

| 页面 | 数据获取 |
|------|----------|
| Users | Client → `fetch("/api/admin/users?page=&q=")` |
| Models | Client → `/api/admin/models` CRUD |
| Assistants | Client → `/api/admin/assistants` CRUD |

Admin 页 **force-dynamic**；与 Console 一致。

---

## 4. 文件清单

| 操作 | 路径 |
|------|------|
| 新增 | `app/admin/**` |
| 新增 | `components/admin/**` |

---

## 5. AC 映射

| AC | 要点 |
|----|------|
| AC-120–124 | Users 页 |
| AC-127–128 | Models 页 |
| AC-134 | Assistants 页 |
