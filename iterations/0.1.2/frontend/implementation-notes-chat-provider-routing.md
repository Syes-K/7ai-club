---
version: 0.1.2
title: Implementation Notes - Chat/Console 适配 Provider 路由重构
status: implemented
commit: 4d854786a9994ad38b6d896b392c00a06ff1d988
---

# Implementation Notes：前端适配 Provider 路由重构（v0.1.2）

## 1. 变更摘要

本次主要是为后端 provider 层重构做前端侧对齐与适配，涉及：

- Chat 面板请求体与路由字段对齐（provider/model）。
- 控制台配置页/意图路由配置页在展示与保存时对齐新的 route 结构与校验口径。
- 日志详情抽屉（LogDetailDrawer）与调试 API 返回结构的展示做兼容性调整。

对应代码变更集中在：

- `src/components/chat/ChatApp.tsx`
- `src/components/console/ConsoleConfigForm.tsx`
- `src/components/console/IntentRoutingConfigApp.tsx`
- `src/components/console/LogDetailDrawer.tsx`

## 2. 与后端契约对齐点

- provider/model：
  - deepseek 允许缺省 model（后端将走默认值）
  - zhipu 必须显式指定 model（否则后端校验/运行期报错）

前端策略：

- 在可编辑位置尽量引导用户选择合法 model（减少运行期错误）。
- 在保存/校验失败时，优先展示后端返回的字段错误（fieldErrors）与可读错误信息。

## 3. 控制台/意图配置页注意事项

- 保存前调用后端校验接口（若页面具备“校验”按钮，则优先走显式校验；保存时也应二次校验）。
- 若当前 route 选择为 zhipu，必须确保 model 字段有值（UI 上可通过禁用保存或提示错误来提前阻断）。

## 4. 自测建议

1. Chat 面板：
   - deepseek：不手动选 model 仍可发起对话（走默认）。
   - zhipu：不选 model 触发明确错误提示（前端/后端至少一侧应可解释）。
2. 意图配置页：
   - 保存前先“校验配置”，确保 route 字段合法。
3. 日志详情：
   - 打开最近一次对话/调试记录，确认 provider/model 字段展示正常，异常响应展示不崩溃。

