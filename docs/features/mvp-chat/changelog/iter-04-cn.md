# iter-04 变更摘要 — 混合数据访问

> **English:** [iter-04.md](./iter-04.md)  
> **中文：** [iter-04-cn.md](./iter-04-cn.md)  
> **迭代索引：** [iter-04/README-cn.md](../../iterations/iter-04/README-cn.md)

---

## 1. 主题

| 主题 | PRD | 设计 |
|------|-----|------|
| 浏览器混合数据访问 | [prd/data-access-cn.md](../prd/data-access-cn.md) | [design/data-access-cn.md](../design/data-access-cn.md) |

影响 **mvp-chat** + **console**（共享 `lib/data/browser`）。

---

## 2. 必读

1. [design/data-access-cn.md](../design/data-access-cn.md)
2. [prd/data-access-cn.md](../prd/data-access-cn.md)

---

## 3. 已实现代码变更

### 3.1 新增

```
lib/data/types.ts
lib/data/errors.ts
lib/data/browser/{conversations,messages,assistants,profile}.ts
lib/services/browser/{conversation-session,assistants,profile,clear-chat,model-label}.ts
lib/api/chat-client.ts
lib/validation/{assistant,profile}.ts
lib/auth/redirect.ts
app/auth/callback/route.ts
supabase/migrations/20260618000000_iter04_data_access_rpc.sql
tests/unit/*.test.ts（6 文件，21 用例）
tests/e2e/iter04-data-access.spec.ts
```

### 3.2 已删除 BFF（`app/api/` 仅保留 chat）

```
app/api/conversations/route.ts
app/api/conversations/[id]/route.ts
app/api/conversations/[id]/session/route.ts
app/api/conversations/[id]/messages/route.ts
app/api/assistants/route.ts
app/api/assistants/[id]/route.ts
app/api/profile/route.ts
lib/chat/fetch-conversation-session.ts
```

### 3.3 保留

```
app/api/chat/route.ts
lib/llm/*
lib/supabase/server.ts   # chat + RSC 鉴权
```

### 3.4 组件迁移（fetch BFF → browser service）

| 组件 | 变更 |
|------|------|
| `chat-app-shell.tsx` | `services.browser.*`；切换会话仅拉 messages |
| `chat-conversation-panel.tsx` | `clear-chat` service；chat 仍 `/api/chat` |
| `assistant-picker-dialog.tsx` | `listAssistantOptions` |
| `assistants-manager.tsx` | assistants service + validation |
| `profile-form.tsx` | profile service；仅提交变更字段 |
| `app/chat/layout.tsx` | 注入 `preferredModel`，减少切换冗余请求 |
| `app/console/profile/page.tsx` | 服务端注入 `initialProfile` |

### 3.5 数据库 RPC（已 apply 远程）

- `create_conversation_with_opening` — 创建对话 + 可选开场白
- `ensure_user_assistants` — 零助理时从模板复制
- `delete_assistant_if_unused` — 有对话则拒绝删除
- `user_profiles` / `assistants` 长度 CHECK

### 3.6 附带修复（非 iter-04 主范围，同批交付）

| 项 | 说明 |
|----|------|
| 注册邮件跳转 | `emailRedirectTo` + `/auth/callback` + middleware |
| Profile 保存 | 空 patch 显示 Saved；避免 provider 不一致误报 Invalid model |
| E2E 清理 | `afterEach` 删除本用例新建的会话 |

---

## 4. 验收清单

- [x] **AC-30** — 切换对话无 `/session` BFF
- [x] **AC-31** — Profile 浏览器层
- [x] **AC-32** — Assistants 浏览器层
- [x] **AC-33** — RPC 创建对话 + 开场白
- [x] **AC-34** — 仅 `/api/chat` 用 LLM 密钥
- [x] 组件不直连 Supabase（`iter04-architecture` 单测）

---

## 5. 手工 QA

| # | 场景 | E2E 覆盖 | 手测 |
|---|------|----------|------|
| 1 | 切换对话 — Network 仅 Supabase，无 session API | AC-30 | [x] |
| 2 | 带开场白新建对话 | AC-33 单测 | [x] |
| 3 | Console Profile / Assistants CRUD | AC-31/32 | [x] |
| 4 | 发消息仅 `/api/chat` | AC-34 | [x] |
| 5 | 有对话时删助理 — 报错 | RPC 单测 | [x] |
| 6 | 注册确认邮件链接（生产域名） | — | [x] |

---

## 6. 自动化测试

| AC | 测试文件 |
|----|----------|
| AC-30 | `tests/unit/conversation-session.test.ts`、`tests/e2e/iter04-data-access.spec.ts` |
| AC-31 | `tests/unit/profile-validation.test.ts`、`tests/e2e/iter04-data-access.spec.ts` |
| AC-32 | `tests/unit/assistant-validation.test.ts`、`tests/unit/assistants-service.test.ts`、`tests/e2e/iter04-data-access.spec.ts` |
| AC-33 | `tests/unit/create-conversation.test.ts` |
| AC-34 | `tests/unit/iter04-architecture.test.ts`、`tests/e2e/iter04-data-access.spec.ts` |
| 组件不直连 Supabase | `tests/unit/iter04-architecture.test.ts` |

```bash
pnpm lint && pnpm build && pnpm test    # 21 单元测试
pnpm test:e2e --workers=1               # smoke 2 + iter-04 4（需 .env.local 中 E2E_TEST_EMAIL/PASSWORD）
pnpm test:ci                          # 以上全部
```

**E2E 前置：** `pnpm exec playwright install chromium`；`.env.local` 配置测试账号。

**2026-06-17 结果：** lint ✓ · build ✓ · unit 21/21 ✓ · e2e 6/6 ✓（本地，已配置凭据）

---

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 创建 iter-04 changelog |
| 2026-06-17 | 实现完成；AC 勾选；补充实测结果与 E2E 清理 |
| 2026-06-17 | 手工 QA 完成；**已交付** |
