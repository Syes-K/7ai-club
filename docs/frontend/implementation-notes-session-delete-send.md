# 前端实现说明：会话删除与发送悬浮（version=0.0.3）

**关联设计**：`iterations/0.0.3/design/spec-session-delete-send-layout.md`  
**关联 API**：`iterations/0.0.3/backend/api-spec.md`

---

## 1. 文件

| 路径 | 说明 |
|------|------|
| `src/lib/chat/session-api-client.ts` | `apiDeleteSession` → `DELETE /api/chat/sessions/{id}` |
| `src/components/chat/SessionSidebar.tsx` | 会话行 `flex`：主区切换 + 删除图标；`deletingSessionId` 时锁定全部删除钮 |
| `src/components/chat/ChatApp.tsx` | `deleteSessionById`（`confirm` 文案与设计一致）、删当前则切首条或新建；footer `relative` + 发送 `absolute bottom-3 right-3` |

---

## 2. 行为摘要

- **确认**：`确定删除此会话？删除后无法恢复。`
- **删当前**：刷新列表后若仍有会话 → `setActiveSessionId(list[0].id)` 并 `loadMessagesForSession`；若无 → `apiCreateSession` 再加载。
- **删非当前**：仅 `setSessions(list)`。
- **错误**：`setSessionsError`，侧栏展示（与初始化错误共用区域）。
- **发送区**：`textarea` `pb-12 pr-[5.5rem]`；按钮 `z-10`、`px-3 py-2`。

---

## 3. 文档路径

- 迭代：`iterations/0.0.3/frontend/implementation-notes-session-delete-send.md`
- 同步：本文档
