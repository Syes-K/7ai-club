# AI Agent 对话 — 服务端实现说明（implementation-notes）

## 目录结构

| 路径 | 职责 |
|------|------|
| `src/app/api/chat/route.ts` | `POST` 流式 SSE 网关 |
| `src/lib/chat/types.ts` | 类型 |
| `src/lib/chat/route-key.ts` | 默认 `provider` + 智谱 `model` |
| `src/lib/chat/zhipu-models.ts` | 智谱模型分组与合法 id |
| `src/lib/chat/constants.ts` | 上下文条数、DeepSeek 默认模型 |
| `src/lib/chat/openai-stream.ts` | 解析 OpenAI 兼容 SSE token |
| `src/lib/chat/providers.ts` | 调用智谱 / DeepSeek 上游 |
| `src/lib/chat/validate-request.ts` | 请求体验证与裁剪 |

## 本地运行

1. 复制 `.env.example` 为 `.env.local`，填入 `ZHIPU_API_KEY` / `DEEPSEEK_API_KEY`（至少一个可用即可测对应线路）。
2. `npm run dev`，打开首页进行对话。

## 自测要点

- [ ] 未配置 key 时接口返回流内 `error` 或可读提示（智谱/DeepSeek 分别测）。
- [ ] `provider=zhipu` + 各 `model` id 校验非法 id 返回 400。
- [ ] 流式：`delta` 多条后以 `done` 结束。
- [ ] 上游 4xx/5xx：能解析为错误信息（见 `providers.ts`）。

## 扩展新厂商

1. 在 `types.ts` 扩展 `ChatProviderId`（或单独策略表）。
2. 新增 `providers` 内 fetch + 若格式非 OpenAI delta，则单独实现解析器或在适配层归一化为 `iterateOpenAIChatStream` 同款 AsyncGenerator。
3. 更新 `validate-request.ts` 与前端模型下拉。
