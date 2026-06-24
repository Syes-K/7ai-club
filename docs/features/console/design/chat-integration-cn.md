# 聊天集成

> **English:** [chat-integration.md](./chat-integration.md)  
> **中文:** [chat-integration-cn.md](./chat-integration-cn.md)  
> **总纲:** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **迭代:** iter-03（已交付）

---

## 1. Chat 壳架构

iter-03 用 **`ChatAppShell`** 替代原 SSR `chat-layout.tsx`：

| 组件 | 职责 |
|------|------|
| `app/chat/layout.tsx` | RSC：auth + profile nickname → Shell |
| `ChatAppShell` | 侧栏持久、会话客户端加载、New Chat 流程 |
| `ChatConversationPanel` | 单会话：header、messages、input、clear |
| `app/chat/[conversationId]/page.tsx` | 返回 `null`（内容由 Shell 加载） |

**导航修复：** `clientNavRef` 区分用户点击与 URL 驱动；`loadSeqRef` 防竞态；`ChatNavigationFeedback` loading/slow/timeout。

---

## 2. New Chat 选择器

`AssistantPickerDialog`：打开时 `GET /api/assistants`，展示 Icon + Name，必须选中后 **Create chat**。

`ChatAppShell.handleNewChat` → Dialog → `POST { assistantId }` → `router.replace(/chat/[id])`。

---

## 3. Session 加载

`GET /api/conversations/[id]/session` 返回：

- `messages[]`
- `assistant`（id, name, icon, system_prompt）
- `modelLabel`（profile 偏好 + provider）

客户端封装：`lib/chat/fetch-conversation-session.ts`。

> **iter-04：** 迁浏览器 Supabase 并行查询，删除此 BFF。

---

## 4. 创建对话 API

`POST /api/conversations` 必填 `assistantId`；校验 `assistants.user_id = auth.uid()`。

`createConversation(userId, assistantId)`：

1. Insert `conversations`
2. 若 `opening_message` 非空 → insert 首条 `assistant` 消息

不再调用 `getDefaultAssistant()`。

---

## 5. `/chat` 入口

- 有最近对话 → redirect 该对话  
- 无对话 → 空态 + New chat（打开选择器），**不再**自动用全局助理创建

---

## 6. Loading UX

> **Global spec:** [loading-ux-cn.md](../../../loading-ux-cn.md) §5.

| 操作 | 机制 |
|------|------|
| 侧栏首屏列表 | `listLoading` → `Loading conversations…` |
| 切换会话 | `pendingId` + 侧栏 `Loading…` + `ChatNavigationFeedback` |
| 删除会话 | `deletingId` → 主面板 `deleting` 阶段 + dialog `Deleting…` |
| 新建会话 | `creating` 按钮文案 |
| 选择器打开 | `Loading assistants…` |
| 发消息 | `useChat` status + `Thinking…` |
| 清空聊天 | dialog `Clearing…`（主面板遮罩可选） |

**导航修复：** `clientNavRef`、`loadSeqRef`；`ChatNavigationFeedback` 含 `loading` / `slow` / `timeout` / `deleting`。

---

## 7. Chat Route

读取用户 profile → `getChatModel(..., preferred_model)`；`system_prompt` 仍来自对话绑定的 assistant。

---

## 8. 助手展示

| 位置 | 组件 |
|------|------|
| 选择器 / 侧栏 / 消息 | `AssistantAvatar`（inline / avatar / hero） |
| 会话 header | icon + assistantName + modelLabel |

---

## 9. 文件

| 操作 | 路径 |
|------|------|
| 新增 | `components/chat/chat-app-shell.tsx` |
| 新增 | `components/chat/assistant-picker-dialog.tsx` |
| 新增 | `components/chat/assistant-avatar.tsx` |
| 新增 | `components/chat/chat-navigation-feedback.tsx` |
| 新增 | `components/chat/chat-conversation-panel.tsx` |
| 新增 | `app/api/conversations/[id]/session/route.ts` |
| 新增 | `lib/chat/fetch-conversation-session.ts` |
| 删除 | `components/chat/chat-layout.tsx` |
| 修改 | `app/chat/page.tsx`、`app/api/conversations/route.ts`、`app/api/chat/route.ts` |
| 修改 | `lib/chat/conversations.ts`（opening message、list icon） |

---

## 10. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 初稿 |
| 2026-06-16 | ChatAppShell、session API、AssistantAvatar；标记已交付 |
| 2026-06-17 | §6 Loading UX；引用全局 [loading-ux-cn.md](../../../loading-ux-cn.md) |
