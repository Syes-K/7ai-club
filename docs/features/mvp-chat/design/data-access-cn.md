# 混合浏览器数据访问 — 技术设计

> **English:** [data-access.md](./data-access.md)  
> **中文：** [data-access-cn.md](./data-access-cn.md)  
> **总纲：** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **PRD：** [prd/data-access-cn.md](../prd/data-access-cn.md)  
> **迭代：** iter-04  
> **状态：** 已实现  
> **文档版本：** v1.0

---

## 1. 目标

- **单一规则：** 密钥与流式走 Node；RLS 保护的 CRUD 走浏览器 Supabase
- **分层清晰**，组件禁止直连 Supabase
- **原子逻辑** 下沉 Postgres RPC
- 迁移完成后 **删除** 冗余 BFF

---

## 2. 流量划分

| 操作 | 通道 | 原因 |
|------|------|------|
| 流式聊天 | `POST /api/chat`（Node） | LLM 密钥、`streamText`、超时 |
| 对话列表 | 浏览器 → Supabase | RLS |
| 消息 + 助理元数据 | 浏览器并行查询 | RLS |
| 创建对话 + 开场白 | 浏览器 → **RPC** | 原子多步 |
| 删对话 / 清空消息 | 浏览器 → Supabase | RLS |
| Profile / Assistants | 浏览器 → Supabase（+ RPC） | RLS |
| 模型展示名 | 浏览器 service | `model-options` + 公开 provider 常量 |

**浏览器禁止：** `service_role`、LLM 密钥、`lib/llm/provider` 敏感路径。

---

## 3. 分层（浏览器）

```
components/                 # 仅 UI；调 hook 或 service
    ↓
hooks/（可选）              # loading/error/refetch
    ↓
lib/services/browser/       # 用例：编排、校验、DTO
    ↓
lib/data/browser/           # 仓储：纯 Supabase 查询
    ↓
lib/supabase/client.ts
```

### 3.1 层级规则

| 层 | 可以 | 不可以 |
|----|------|--------|
| **Component** | 渲染、事件 | `createClient()`、CRUD 用 `fetch('/api/...')` |
| **Hook** | 组合 service + 状态 | 写 SQL |
| **Service** | 并行查询、RPC、Zod 校验 | Tailwind |
| **Data** | `.from().select()` | 业务规则 |
| **Types** | `lib/data/types.ts` | — |

---

## 4. 目标目录

见 [data-access.md §4](./data-access.md)（英文版目录树）。

---

## 5. 决策树

```
要读写数据？
├─ LLM / 流式 / 第三方密钥？ → /api/chat（Node）
├─ 多步必须原子？ → Supabase RPC（优先）
├─ RLS 可覆盖的 CRUD？ → lib/data/browser + lib/services/browser
└─ 仅 RSC 首屏？ → lib/data/server（可选）
```

---

## 6. 数据库 RPC

迁移：`supabase/migrations/20260618000000_iter04_data_access_rpc.sql`（**已 apply 远程**）

- **`create_conversation_with_opening`** — 校验助理归属 → 插入对话 → 可选开场白
- **`ensure_user_assistants`** — 零助理时从模板复制
- **`delete_assistant`**（可选）— 有对话则拒绝
- CHECK 约束与 app 校验对齐

---

## 7. BFF 迁移表

| 现有路由 | iter-04 | 动作 |
|----------|---------|------|
| `GET /api/conversations` | `data.browser.conversations.list()` | **已删除** |
| `GET .../session` | `services.browser.loadConversationSession()` | **已删除** |
| `POST /api/conversations` | RPC | **已删除** |
| `DELETE ...` / clear messages | data 层 | **已删除** |
| Assistants / Profile API | data + RPC | **已删除** |
| **`POST /api/chat`** | **保留** | 不变 |

---

## 8. 组件迁移清单

| 组件 | 之前 | 之后 |
|------|------|------|
| `chat-app-shell.tsx` | fetch API | `services.browser.*` ✓ |
| `assistants-manager.tsx` | fetch API | service ✓ |
| `profile-form.tsx` | fetch API | service ✓ |
| `assistant-picker-dialog.tsx` | fetch API | 共享 list ✓ |
| `chat-conversation-panel.tsx` | clear 用 fetch | service；chat 仍 `/api/chat` ✓ |

---

## 9. 模型展示名（浏览器）

用 `NEXT_PUBLIC_LLM_PROVIDER` + `model-options` 在 service 层拼 label，替代 session API 里的 server `getLlmDisplayLabel`。

---

## 10. 安全清单

- [x] 浏览器写入全走 RLS
- [x] RPC 内用 `auth.uid()`
- [x] 无 LLM 密钥进 `NEXT_PUBLIC_*`
- [x] Chat 仍 `getUser()` 门禁

---

## 11. 验收映射

| AC | 要点 |
|----|------|
| AC-30 | 无 session BFF |
| AC-31–32 | profile / assistants service |
| AC-33 | RPC 创建对话 |
| AC-34 | 仅 chat 用 LLM env |

---

## 12. 测试计划

- [x] 切换对话：无 `/session` BFF（E2E AC-30）
- [x] 开场白新建（单元 AC-33）
- [x] 有对话删助理报错（RPC）
- [x] Profile 保存（E2E AC-31）
- [x] 发消息仅 `/api/chat`（E2E AC-34）
- [x] `pnpm build`；`pnpm test` 21/21；`pnpm test:e2e` 6/6

详见 [changelog/iter-04-cn.md](../changelog/iter-04-cn.md) §6。

---

## 13. 修订记录

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-06-16 | v0.1 | iter-04 初稿 |
| 2026-06-17 | v1.0 | 实现完成；BFF 已删；RPC 已 apply |