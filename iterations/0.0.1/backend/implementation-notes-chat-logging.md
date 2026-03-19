# 服务端实现说明：日志能力（version=0.0.1）

**关联需求**：`iterations/0.0.1/product/prd-chat-logging.md`
**关联设计**：`iterations/0.0.1/design/spec-chat-logging.md`

---

## 1. 代码变更

| 文件 | 变更 |
|------|------|
| `src/lib/chat/logger.ts` | 新增日志模块：按小时写入 `.next/logs/*.log`，同时输出控制台 |
| `src/app/api/chat/route.ts` | 接入 API 层事件日志与流式结果日志（含 `responsePreview`） |
| `src/lib/chat/providers.ts` | 接入 provider 层调用开始/成功/失败日志 |

---

## 2. 事件与字段落地

### 2.1 API 层

- `api.invalid_json`
- `api.validation_failed`
- `api.request_received`（含 `messages`）
- `api.stream_completed`（含 `chunkCount`、`totalChars`、`responsePreview`）
- `api.stream_failed`

### 2.2 Provider 层

- `provider.request_start`
- `provider.request_ok`
- `provider.request_error`

字段含：`requestId`、`provider`、`model`、`messageCount`、`messages`、`elapsedMs`、`status` 等。

---

## 3. 验证结果

- `npm run build` 通过。
- 触发对话请求后，`.next/logs/` 下生成小时文件并持续追加 JSON 行。

---

## 4. 运维与排障建议

- 通过 `requestId` 聚合同一请求的全链路日志。
- 优先查看 `provider.request_error` 与 `api.stream_failed` 判断是否上游问题。
- 若日志体积偏大，后续可增加 `CHAT_LOG_TRUNCATE` / `CHAT_LOG_FULL_MESSAGE` 等配置开关。

---

## 5. 文档路径

- 主路径：`iterations/0.0.1/backend/implementation-notes-chat-logging.md`
- 同步：`docs/backend/implementation-notes-chat-logging.md`
