# 后端实现说明：`POST /api/debug`（0.0.7）

- 路由：`src/app/api/debug/route.ts`。
- 校验与截断：`src/lib/chat/validate-debug-request.ts`（`parseAndValidateDebugChatBody`）。
- 流式：`createChatCompletionSseStream({ ..., skipChatLog: true })`；`skipChatLog` 会跳过 `run-chat-stream` 内及 `providers` 内所有 `logChat` 调用。
- **未修改** `src/app/api/chat/route.ts`。
