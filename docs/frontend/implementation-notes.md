# AI Agent 对话 — 前端实现说明（implementation-notes）

## 文件

| 路径 | 说明 |
|------|------|
| `src/app/page.tsx` | 根页面，挂载全屏 `ChatApp` |
| `src/components/chat/ChatApp.tsx` | 客户端：消息状态、模型选择、SSE 消费、加载/错误/重试/清空 |
| `src/components/chat/SessionSidebar.tsx` | **0.0.2**：会话侧栏 / 窄屏抽屉 |
| `src/lib/chat/session-api-client.ts` | **0.0.2**：会话与消息 REST 客户端；**0.0.3**：`apiDeleteSession` |
| `src/app/console/page.tsx` | **0.0.4**：配置管理页（读盘 + 表单） |
| `src/components/console/ConsoleConfigForm.tsx` | **0.0.4**：`PUT /api/console/config` |
| `src/lib/config/public-config-client.ts` | **0.0.4**：对话页读 `GET /api/config/public` |

## 行为摘要

- **默认模型**：首屏与 `DEFAULT_CHAT_ROUTE` 一致；**0.0.4** 起客户端在挂载后尝试与 `GET /api/config/public` 对齐（失败则保持静态默认）。详见 `docs/frontend/implementation-notes-console-config.md`。
- **布局（迭代 0.0.1）**：模型选择在 **顶栏**；底部仅输入框 + 发送；发送/清空/重试带线框图标。详见 `docs/frontend/implementation-notes-chat-layout-buttons.md`。
- **多会话与持久化（迭代 0.0.2）**：侧栏列表、`POST /api/chat` 使用 `sessionId` + 本轮 `content`（或 `retryLast`）。详见 `docs/frontend/implementation-notes-chat-sessions-sqlite.md`。
- **会话删除与发送悬浮（迭代 0.0.3）**：侧栏删除、`DELETE` 会话、输入区右下角发送。详见 `docs/frontend/implementation-notes-session-delete-send.md`。
- **快捷键**：⌘/Ctrl + Enter 发送；Enter 换行（`textarea`）。
- **请求进行中**：禁用模型下拉与输入/发送（避免重复提交）。
- **SSE**：解析 `data: {...}` 行，处理 `delta` / `done` / `error`。
- **请求体（0.0.2 起）**：主流程为服务端按会话拼上下文；前端不再发送全量 `messages[]`（后端仍支持 legacy 供其他客户端）。

## 运行

`npm run dev`，浏览器访问根路径。
