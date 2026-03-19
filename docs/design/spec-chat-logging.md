# 设计说明：大模型交互日志能力（version=0.0.1）

**输入需求**：`iterations/0.0.1/product/prd-chat-logging.md`

---

## 1. 设计目标

为聊天服务端提供可追踪、可留存的结构化日志，保证一次请求从入口到上游再到流式完成/失败可完整追溯。

---

## 2. 方案概览

### 2.1 日志写入路径与切分

- 日志目录：`<projectRoot>/.next/logs/`
- 文件命名：`YYYY-MM-DD-HH.log`
- 写入格式：JSON Lines（每行一个 JSON）

### 2.2 日志模块

- 新增 `src/lib/chat/logger.ts`
- 对外接口：`logChat(level, event, payload)`
- 行为：
  1. 标准化 payload（含 Error 序列化）
  2. 控制台输出（`info/warn/error`）
  3. 异步追加到小时文件

### 2.3 事件模型

- API 层：
  - `api.invalid_json`
  - `api.validation_failed`
  - `api.request_received`
  - `api.stream_completed`
  - `api.stream_failed`
- Provider 层：
  - `provider.request_start`
  - `provider.request_ok`
  - `provider.request_error`

### 2.4 关键字段

- 通用：`ts`、`level`、`event`
- 关联：`requestId`
- 路由：`provider`、`model`
- 请求：`messageCount`、`messages`
- 流式结果：`chunkCount`、`totalChars`、`responsePreview`
- 诊断：`elapsedMs`、`status`、`error`

---

## 3. 交互与状态

- 正常流式：`request_received` → `provider.request_start` → `provider.request_ok` → `stream_completed`
- 上游失败：`request_received` → `provider.request_start` → `provider.request_error` → `stream_failed`
- 参数失败：`invalid_json` / `validation_failed`（直接返回）

---

## 4. 非功能约束

- 写文件失败不影响主链路，记录 `log_write_failed` 到控制台。
- `responsePreview` 长度限制（当前 4000 字符）防止日志膨胀。

---

## 5. 文档路径

- 主路径：`iterations/0.0.1/design/spec-chat-logging.md`
- 同步：`docs/design/spec-chat-logging.md`
