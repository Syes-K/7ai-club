# PRD：大模型交互日志能力（version=0.0.1）

## 1. 需求摘要

### 1.1 背景
当前已支持 AI 对话与流式返回，但线上/本地排障时需要从日志快速定位：请求参数、上游调用结果、流式输出情况、失败原因。此前日志主要在控制台，缺乏可留存文件与结构化字段。

### 1.2 目标
在不改动对外 API 契约的前提下，补齐服务端日志能力，支持：

- 日志落盘到项目根 `.logs/`（不放在 `.next` 下，避免构建清理丢失）
- 按小时文件切分（`YYYY-MM-DD-HH.log`）
- 记录请求/上游调用/流式完成/失败关键字段
- 能看到交互 `messages` 与模型返回文本预览（用于排障）

### 1.3 成功指标

- 可通过单个 `requestId` 串联一次请求的 API 层与 provider 层日志。
- 新请求后 `.logs/` 下产生对应小时日志文件。
- 发生错误时可从日志定位到失败阶段（校验、上游、流式）。

---

## 2. 功能范围

### 2.1 In Scope

- 新增统一日志模块（`logChat`），同时输出控制台与文件。
- API 层记录：`api.request_received`、`api.stream_completed`、`api.stream_failed`、`api.validation_failed`、`api.invalid_json`。
- Provider 层记录：`provider.request_start`、`provider.request_ok`、`provider.request_error`。
- 日志字段包含 `requestId`、`provider`、`model`、`messageCount`、`messages`、耗时与响应预览。

### 2.2 Out of Scope

- 前端页面日志展示与查询功能。
- 第三方日志平台接入（如 ELK / Datadog）。
- 日志脱敏策略中心化与分级权限（后续迭代）。

---

## 3. 风险与约束

- `messages` 与 `responsePreview` 含业务文本，存在敏感信息风险；当前迭代以排障优先，后续需补脱敏/截断策略开关。
- 日志目录与 `.next` 分离；仍主要用于本地与短周期排障，不作为长期审计存储。

---

## 4. 文档路径

- 主路径：`iterations/0.0.1/product/prd-chat-logging.md`
- 同步：`docs/product/prd-chat-logging.md`
