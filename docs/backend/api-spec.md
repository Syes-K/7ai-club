# AI Agent 对话 — API 说明（api-spec）

## 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/chat` | 流式对话（SSE） |

**运行时**：`nodejs`（`src/app/api/chat/route.ts`）。

---

## `POST /api/chat`

### 请求头

- `Content-Type: application/json`

### 请求体（JSON）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `messages` | `array` | 是 | 对话消息，至少 1 条 |
| `messages[].role` | `string` | 是 | `user` \| `assistant` \| `system` |
| `messages[].content` | `string` | 是 | 文本内容 |
| `provider` | `string` | 是 | `zhipu` \| `deepseek` |
| `model` | `string` | 智谱时可选 | 智谱模型 id，缺省为 `glm-4-flash`；须为 `zhipu-models` 中已列 id |

服务端会按 `MAX_MESSAGES_IN_CONTEXT` 截取尾部消息，控制上下文长度（见 `data-models.md`）。

### 响应

- **成功**：`200`，`Content-Type: text/event-stream; charset=utf-8`
- **SSE 事件**：每行一条 `data: <JSON>\n\n`
  - 流式增量：`{"type":"delta","text":"<片段>"}`
  - 正常结束：`{"type":"done"}`
  - 错误：`{"type":"error","message":"<可读说明>"}`（仍可能为 200，由流内事件表示业务/上游错误）
- **校验失败**：`400`，JSON `{ "error": string }`

### 环境变量

| 变量 | 用途 |
|------|------|
| `ZHIPU_API_KEY` | 智谱 `Authorization: Bearer` |
| `DEEPSEEK_API_KEY` | DeepSeek OpenAI 兼容接口 |

### 上游地址（服务端）

- 智谱：`https://open.bigmodel.cn/api/paas/v4/chat/completions`（流式，OpenAI 兼容 delta）
- DeepSeek：`https://api.deepseek.com/v1/chat/completions`，模型固定 `deepseek-chat`（见 `constants.ts`）

---

## 与产品/设计对应

- 流式、多轮、模型切换：见 `docs/product/prd-ai-agent.md` 与 `docs/design/spec-ai-agent.md`。
