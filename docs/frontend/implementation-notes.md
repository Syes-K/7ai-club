# AI Agent 对话 — 前端实现说明（implementation-notes）

## 文件

| 路径 | 说明 |
|------|------|
| `src/app/page.tsx` | 根页面，挂载全屏 `ChatApp` |
| `src/components/chat/ChatApp.tsx` | 客户端：消息状态、模型选择、SSE 消费、加载/错误/重试/清空 |

## 行为摘要

- **默认模型**：与 `DEFAULT_CHAT_ROUTE` 一致（智谱 `glm-4-flash`）。
- **布局（迭代 0.0.1）**：模型选择在 **顶栏**；底部仅输入框 + 发送；发送/清空/重试带线框图标。详见 `docs/frontend/implementation-notes-chat-layout-buttons.md`。
- **快捷键**：⌘/Ctrl + Enter 发送；Enter 换行（`textarea`）。
- **请求进行中**：禁用模型下拉与输入/发送（避免重复提交）。
- **SSE**：解析 `data: {...}` 行，处理 `delta` / `done` / `error`。
- **API 消息拼装**：仅包含已完成的 user/assistant 轮次；当前进行中的 assistant 不参与 `messages` 请求体（与 PRD 多轮/重试一致）。

## 运行

`npm run dev`，浏览器访问根路径。
