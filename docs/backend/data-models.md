# AI Agent 对话 — 数据与类型（data-models）

## 共享类型（`src/lib/chat/types.ts`）

- `ChatRole`: `user` | `assistant` | `system`
- `ChatMessage`: `{ role, content }`
- `ChatProviderId`: `zhipu` | `deepseek`
- `ChatRoute`: `{ provider, model? }` — 与默认路由 `route-key.ts` 一致

## 智谱模型清单（`src/lib/chat/zhipu-models.ts`）

- `ZHIPU_MODEL_GROUPS`：分组 + `id` / `label` / `hint`（供前端下拉与文档）
- `ZHIPU_MODEL_IDS`：合法 id 扁平列表，用于服务端校验

## 常量（`src/lib/chat/constants.ts`）

- `MAX_MESSAGES_IN_CONTEXT`：请求中最多保留的消息条数（含 user/assistant/system）
- `DEEPSEEK_DEFAULT_MODEL`：`deepseek-chat`

## 持久化

首版 **无数据库**；会话仅内存，与 PRD「不持久化」一致。
