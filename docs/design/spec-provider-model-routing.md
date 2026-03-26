---
version: 0.1.2
title: 设计规格 - Provider/Model 路由与上游请求统一层
status: implemented
commit: 4d854786a9994ad38b6d896b392c00a06ff1d988
---

# 设计规格：Provider/Model 路由与上游请求统一层（v0.1.2）

## 1. 目标与范围

本规格定义一个统一的“模型路由 + 上游请求”抽象层，目标是让所有调用方只需关心：

- **选哪个 provider**（`zhipu` / `deepseek`）
- **用哪个 model**（可选/必填由 provider 规则决定）
- **需要哪种调用形态**（SSE 流式 / 非流式文本）

范围覆盖：

- 路由数据结构（`ChatRoute`）与规范化策略
- 路由校验口径（保存配置/运行期入口复用）
- 上游请求契约（SSE 与非流式）
- 错误与可观测性约定

## 2. 数据结构

### 2.1 Provider 与 Route

对应代码：`src/lib/provider/types.ts`

- `ChatProviderId`：`"zhipu" | "deepseek"`
- `ChatRoute`：
  - `provider: ChatProviderId`
  - `model?: string`

### 2.2 关键约束（必须与实现一致）

- **provider 合法性**：仅允许 `zhipu` / `deepseek`
- **model 合法性**：若提供 model，必须是受支持的 `model id`（白名单）
- **provider 与 model 的必填规则**：
  - `zhipu`：运行时 **必须有 model**（否则无法确定上游请求目标）
  - `deepseek`：model 可缺省；缺省时使用服务端默认值

说明：本期实现将“model 是否必填”的强约束落在 provider 层的 model 解析逻辑中；配置保存侧建议提前校验并给出字段级错误。

## 3. 路由规范化与构造

对应代码：`src/lib/provider/route.ts`

### 3.1 normalizeChatRouteModel

- 仅对 `zhipu` 的 `model` 做 trim 与空值规整；
- 对非 `zhipu` 的 `model` 输入不保留到 route 中，避免出现“存了无意义 model 字段”的配置漂移。

### 3.2 buildChatRouteConfig(provider, model?)

统一的 route 构造入口，用于将 UI/配置输入规整为标准结构。

## 4. 校验口径

对应代码：`src/lib/provider/validate-chat-route.ts`

### 4.1 validateChatRouteProviderAndModel

输入：`provider?: unknown, model?: unknown`

输出：

- `provider: ChatProviderId | null`
- `model?: string`（trim 后的可选值）
- `fieldErrors[]`（字段级错误）

字段错误约定：

- `field: "chatRoute.provider"` / `field: "chatRoute.model"`
- `code: "CFG_ROUTE_BROKEN"`
- `message`: 面向配置端/控制台可读的错误说明

建议接入点：

- 控制台保存配置/校验配置
- intent-routing 配置保存与 validate
- debug/execute-once 等调试入口

## 5. 上游请求契约

对应代码：`src/lib/provider/providers.ts`

### 5.1 SSE 流式对话

函数：`fetchChatUpstreamSseStream({ provider, model, messages, requestId, options? })`

- 输入 messages：以 OpenAI 兼容的 role/content 映射发送
- 输出：`ReadableStream<Uint8Array>`（上游原始 SSE 字节流）

### 5.2 非流式补全文本

函数：`fetchChatCompletionText({ provider, model, messages, requestId, maxTokens? })`

- 输出：`string`
- 解析：读取 OpenAI 兼容响应的 `choices[0].message.content`

### 5.3 model -> upstream meta

按 model id 解析：

- `apiKey`
- `baseUrl`
- `url = ${baseUrl}/completions`

若 model 不存在或缺少 `apiKey`：

- 直接失败并返回可定位的错误信息（含 model id）

## 6. 错误策略

- **配置类错误**：尽量在保存/校验阶段以 `fieldErrors` 形式返回（可修复、可定位）。
- **运行期错误**：
  - 上游 HTTP 非 2xx：抛出 `Chat API 错误 ${status}`，并截断 detail
  - 响应体缺失/非 JSON/无有效 content：抛出可读错误

## 7. 可观测性（日志约定）

provider 层统一日志事件（最小集）：

- `provider.request_start`
- `provider.request_ok`（含 `status`、`elapsedMs`）
- `provider.request_error`（含 `status`、`detail`（截断））

建议字段：

- `requestId`
- `provider`
- `model`
- `messageCount`

## 8. 与 intent-routing / nodes 的边界

- `intent-routing`：决定路由与分支（命中/回退/是否检索/何时调用模型）。
- `provider`：给定 route + messages，稳定地请求上游并产出 SSE/文本，统一日志与错误口径。
- `nodes`：为后续更细粒度编排提供骨架，避免 provider 逻辑散落在引擎与执行器中。

