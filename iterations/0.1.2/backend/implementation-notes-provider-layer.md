---
version: 0.1.2
title: Implementation Notes - Provider Layer & Upstream Requests
status: implemented
commit: 4d854786a9994ad38b6d896b392c00a06ff1d988
---

# Implementation Notes：Provider Layer 与上游请求统一（v0.1.2）

## 1. 变更摘要

本次提交将“模型路由（provider/model）+ 上游请求（SSE/非流式）”收敛到 `src/lib/provider/*`，并清理旧实现：

- 新增：
  - `src/lib/provider/types.ts`：provider 与 route 类型
  - `src/lib/provider/route.ts`：route 构造与 model 规范化
  - `src/lib/provider/models.ts`：模型列表（分组）与 meta
  - `src/lib/provider/providers.ts`：统一上游请求（SSE + 非流式）与日志
  - `src/lib/provider/validate-chat-route.ts`：路由校验（供调用侧/配置侧复用）
- 删除：
  - `src/lib/chat/providers.ts`
  - `src/lib/chat/zhipu-models.ts`

同时对 `/api/chat`、debug API、intent-routing 的校验与调用点做了适配更新。

## 2. 路由与校验口径

- `ChatRoute`：`{ provider, model? }`
- model 解析规则：
  - `deepseek`：可缺省，缺省时使用默认 model（服务端常量）。
  - `zhipu`：必须显式提供 model；缺省直接抛错（更早暴露配置问题）。

推荐在“接收外部输入/保存配置/执行一次调试”等入口统一调用 `validate-chat-route`，避免出现：

- 存储时允许无效 route；
- 运行时才在 provider 层抛错导致用户感知更差。

## 3. 上游请求（核心实现）

### 3.1 SSE 流式（对话主链路）

- 导出函数：`fetchChatUpstreamSseStream`
- 入参包含 `provider/model/messages/requestId`
- 返回 `ReadableStream<Uint8Array>`（上游原始 SSE 字节流）

### 3.2 非流式补全（摘要/辅助链路）

- 导出函数：`fetchChatCompletionText`
- 基于 OpenAI 兼容响应解析 `choices[0].message.content`

### 3.3 上游 meta 解析

- `resolveUpstreamMeta(modelId)`：
  - 若 model 不存在 -> 抛错 `model 不存在`
  - 若 model 缺少 `apiKey` -> 抛错 `服务端未配置 API Key`
  - 请求 URL 统一拼为 `${baseUrl}/completions`

## 4. 统一日志

provider 层统一写入三类日志事件：

- `provider.request_start`
- `provider.request_ok`（含 status/elapsedMs）
- `provider.request_error`（含 status/detail，detail 截断 500）

说明：

- **不建议**在日志中记录完整 prompt/response；目前仅记录 message 的 role/content（若后续发现风险，可在 provider 层集中脱敏/裁剪）。

## 5. 与 intent-routing 的关系（对齐点）

- `intent-routing` 的职责：决定使用哪个 `ChatRoute`、何时调用（意图识别/检索/直答/回退）。
- `provider` 的职责：给定 `provider/model/messages`，稳定地产出 SSE 或文本，并提供可观测性。

## 6. 自测建议

1. **路由校验**：
   - zhipu 不传 model：应校验失败或运行时明确报错（取决于入口是否接入校验）。
   - deepseek 不传 model：应能正常走默认 model。
2. **上游错误处理**：
   - 故意配置缺少 API Key 的 model：应直接报错 `服务端未配置 API Key`。
3. **日志一致性**：
   - 同一 requestId 下能看到 start/ok 或 start/error，且字段齐全。

