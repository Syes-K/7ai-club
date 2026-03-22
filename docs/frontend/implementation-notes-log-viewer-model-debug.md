# 前端实现说明：日志消息调试（0.0.7）

## 文件

- `src/components/console/LogDetailDrawer.tsx`：调试 UI、调用 `/api/debug`、消费 SSE。
- `src/lib/console/build-log-debug-messages.ts`：根据日志中的 `messages` 原始值 + 用户说明组装 `ChatMessage[]`（客户端截断）。
- `src/lib/chat/sse-consume.ts`：解析与 `/api/chat` 同构的 SSE 行（供抽屉使用，**不修改** `ChatApp.tsx`）。

## 行为摘要

- 打开含 `messages` 的详情时展示调试区；`fetchPublicAppConfig` 取 `maxMessagesInContext` 与默认 model。
- `POST /api/debug`，body 为 `{ provider, model?, messages }`。
