# iter-03 变更摘要 — console

> **English:** [iter-03.md](./iter-03.md)  
> **中文:** [iter-03-cn.md](./iter-03-cn.md)  
> **迭代索引:** [iter-03/README-cn.md](../../iterations/iter-03/README-cn.md)

---

## 1. 本迭代交付主题

| 主题 | PRD | 设计 |
|------|-----|------|
| Console 壳 + 占位页 | [prd/placeholders-cn.md](../prd/placeholders-cn.md) | [design/console-shell-cn.md](../design/console-shell-cn.md) |
| Profile | [prd/profile-cn.md](../prd/profile-cn.md) | [design/profile-cn.md](../design/profile-cn.md) |
| Assistants CRUD | [prd/assistants-cn.md](../prd/assistants-cn.md) | [design/assistants-cn.md](../design/assistants-cn.md) |
| New Chat 选择器 | [prd/chat-assistant-picker-cn.md](../prd/chat-assistant-picker-cn.md) | [design/chat-integration-cn.md](../design/chat-integration-cn.md) |

---

## 2. 需求 vs 实现差异

### 2.1 原 PRD 范围内 — 已实现

| 需求项 | 实现 | 关键路径 |
|--------|------|----------|
| Console 壳 + 5 项侧栏 | ✅ | `app/console/*`, `components/console/console-shell.tsx` |
| Profile nickName + 模型偏好 | ✅ | `components/console/profile-form.tsx`, `/api/profile` |
| Assistants 多助理 CRUD | ✅ | `components/console/assistants-manager.tsx`, `/api/assistants` |
| New Chat 必选助理 | ✅ | `components/chat/assistant-picker-dialog.tsx` |
| 占位页 Models/KB/MCP | ✅ | `app/console/{models,knowledge,mcp}/page.tsx` |
| Profile 模型解析 | ✅ | `lib/llm/provider.ts` → `resolveChatModelId` |
| 迁移 user_profiles + assistants.user_id | ✅ | `20260617000000_console_user_profiles_assistants.sql` |
| middleware + 顶栏/UserMenu 入口 | ✅ | `middleware.ts`, `site-header.tsx`, `user-menu.tsx` |

### 2.2 开发中扩展（原 PRD 未写，已纳入 iter-03 交付）

| 扩展 | 说明 | 路径 |
|------|------|------|
| **Icon（emoji）** | 助理可选 emoji 图标；侧栏/消息/选择器展示 | `20260617100000_assistant_icon_opening.sql`, `AssistantAvatar` |
| **Opening message** | 创建对话时写入首条 `assistant` 消息（方案 B） | `lib/chat/conversations.ts` `createConversation` |
| **Assistants 表格列** | 除 Name/Updated 外增加 Icon、Opening message 预览 | `assistants-manager.tsx` |
| **侧栏 assistant 元数据** | 对话列表展示 icon + assistant name | `chat-sidebar.tsx`, `listConversations` |

### 2.3 架构调整（为体验修复，iter-04 计划收敛）

| 原计划 / 设计文档 | 实际实现 | 备注 |
|-------------------|----------|------|
| SSR `chat-layout.tsx` 整页加载 | **`ChatAppShell`** 客户端加载 session | 解决切换对话长时间 loading |
| 无 session 聚合 API | **`GET /api/conversations/[id]/session`** | iter-04 迁浏览器 Supabase 后删除 |
| — | **`ChatNavigationFeedback`** 导航 loading/超时 | 非 PRD，UX 加固 |
| — | **`clientNavRef` / `loadSeqRef`** 防重复加载 | 修复无限 loading 循环 |
| RLS `assistants_select_own` | `assistants_select_own_or_legacy` | 支持旧对话引用全局助理 |
| 设计引用 `assistant-form-dialog.tsx` | 表单内嵌于 `AssistantsManager` `<dialog>` | 实现合并，无独立文件 |
| 设计引用 `chat-layout.tsx` | 已删除，由 `ChatAppShell` 替代 | — |

### 2.4 已知偏差 / 后续迭代

| 项 | 状态 | 说明 |
|----|------|------|
| CRUD 经 BFF `/api/*` | **iter-04** | 计划迁浏览器 Supabase + RPC |
| Landing 首页 `compactUserMenu` | 保留 | 首页顶栏仅头像；Chat/Console 显示 nickname（AC-04） |
| Profile 保存反馈 | 行内 "Saved." | PRD 允许 toast 或行内，已满足 |

---

## 3. 数据库 / API 增量（已交付）

| 项 | 说明 |
|----|------|
| `user_profiles` | nickname, preferred_model + RLS |
| `assistants.user_id` | 每用户多助理；平台模板 `user_id IS NULL` |
| `assistants.icon`, `opening_message` | 第二 migration |
| `GET/PATCH /api/profile` | Profile CRUD |
| `GET/POST /api/assistants`, `PATCH/DELETE /api/assistants/[id]` | Assistants CRUD |
| `POST /api/conversations { assistantId }` | 创建 + 可选 opening message |
| `GET /api/conversations/[id]/session` | 聚合 messages + assistant + modelLabel |

---

## 4. 验收清单

- [x] **AC-01** — 未登录 `/console/*` 重定向登录  
- [x] **AC-02** — 顶栏 + UserMenu Console 入口  
- [x] **AC-03** — 侧栏 5 项、高亮、移动端 drawer  
- [x] **AC-04** — Profile nickName 在顶栏（Chat/Console md+）与 UserMenu 展示  
- [x] **AC-05** — Profile 模型偏好影响新对话  
- [x] **AC-06** — 新增助理（Name + System prompt；可选 Icon/Opening）  
- [x] **AC-07** — 编辑助理  
- [x] **AC-08** — 删除助理（有对话时 409 阻止）  
- [x] **AC-09** — New Chat 助理选择器  
- [x] **AC-10** — 所选 prompt + profile 模型  
- [x] **AC-11** — 占位页  
- [x] **AC-12** — C2 视觉；英文 UI  

---

## 5. 手工 QA

1. 登录 → 从顶栏与 UserMenu 进入 Console  
2. Profile：设置 nickName → 检查 Chat/Console 顶栏短标签与 UserMenu  
3. Profile：改模型 → 新对话使用新模型  
4. Assistants：增删改；有对话时删除被阻止  
5. Assistants：设置 icon + opening message → New Chat 后首条为开场白  
6. New Chat：必须选助理；侧栏显示 icon + name  
7. 切换对话：loading 反馈正常，无无限循环  
8. 占位页可访问  
9. 登出后 `/console` 跳转登录  
10. `pnpm build` 通过  

---

## 6. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 创建 iter-03 changelog |
| 2026-06-16 | 补充需求 vs 实现差异；AC 全部勾选；标记 iter-03 已交付 |
