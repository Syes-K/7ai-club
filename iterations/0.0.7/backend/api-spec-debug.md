# API：`POST /api/debug`（0.0.7）

## 用途

将**已由前端组装好的** OpenAI 兼容 `messages` 发往模型，**SSE 流式**返回；**不写**聊天落盘日志（不调用 `logChat`）。

## 请求

`Content-Type: application/json`

```json
{
  "provider": "deepseek",
  "model": "glm-4-flash",
  "messages": [
    { "role": "user", "content": "..." }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `provider` | `"zhipu"` \| `"deepseek"` | 必填 |
| `messages` | `{ role, content }[]` | 必填，非空；`role` 为 user/assistant/system，`content` 为字符串 |
| `model` | string | 选填；`provider=zhipu` 时缺省用应用配置 `defaultModel`，且须在允许列表内 |

服务端按 `maxMessagesInContext` 对 `messages` **仅保留末尾 K 条**。

## 响应

- `200`：`text/event-stream`，与现有聊天流一致：`data: {"type":"delta","text":"..."}`，`done`，`error`。
- `400`：JSON `{ "error": "..." }`（校验失败）。

## 实现要点

- 内部复用 `createChatCompletionSseStream`，传入 `skipChatLog: true`，并在 `fetchZhipuSseStream` / `fetchDeepseekSseStream` 上跳过 provider 侧 `logChat`。
