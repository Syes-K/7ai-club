---
version: 0.1.2
title: PRD - Provider/Model 路由重构与统一上游请求
status: implemented
commit: 4d854786a9994ad38b6d896b392c00a06ff1d988
---

# PRD：Provider/Model 路由重构与统一上游请求（v0.1.2）

## 1. 背景与问题

随着意图路由与“执行一次调试”等能力落地，服务端模型调用在多个链路中出现重复实现与分散校验，导致：

- provider/model 的解析规则不一致（默认值、必填约束、错误信息口径不统一）。
- 上游调用（SSE 流式 + 非流式补全）难以复用，同类日志与错误处理重复。
- 新增模型/厂商时需要在多处修改，回归成本高。

## 2. 目标

- **统一** provider/model 的路由表达与校验口径（尤其是“哪个 provider 必须显式 model”）。
- **收敛** 上游请求实现（SSE 流式对话 + 非流式补全），统一错误处理与日志字段。
- 为后续扩展（新增厂商/模型组、灰度切换）提供更清晰的模块边界。

## 3. 范围（本次已实现）

- 新增 `src/lib/provider/*`：
  - provider/model 类型、路由构造与规范化；
  - 统一上游请求：流式 SSE 与非流式补全文本；
  - 根据 model id 解析 baseUrl/apiKey 等上游 meta；
  - 对上游请求 start/ok/error 写入统一日志事件。
- 新增 `src/lib/nodes/*`（节点化执行骨架），与意图路由链路对齐并预留扩展位。
- 移除旧实现：
  - 删除 `src/lib/chat/providers.ts`、`src/lib/chat/zhipu-models.ts`（旧的 provider/model 分散配置与调用方式）。
- 对齐现有功能模块的调用与校验：
  - `/api/chat`、debug API、intent-routing 引擎/执行器、控制台配置与页面展示逻辑随之调整。

## 4. 非目标（本次不做）

- 不新增新的业务功能入口（以“重构与对齐”为主）。
- 不实现真正的图调度（nodes 仅提供骨架/占位，具体执行仍沿用现有引擎策略）。
- 不在本 PRD 中定义 UI/交互改版（仅描述因接口/结构变更引起的适配）。

## 5. 风险与回滚

- **风险**：provider/model 校验口径变化可能导致部分旧配置无法通过校验或运行期报错更早暴露。
- **回滚**：可基于该 commit 前的版本回退（恢复旧 `chat/providers` 与 `zhipu-models`，并撤销 `src/lib/provider` 的接入点）。

## 6. 验收要点（文档级）

- provider/model 的默认与必填规则在文档与代码中保持一致。
- 上游错误信息与日志字段在不同调用点一致（至少包含 requestId、provider、model、status、elapsedMs）。
- 旧 provider/model 相关文件已移除，代码引用已迁移到 `src/lib/provider/*`。

