# 设计说明：日志消息列表模型调试（0.0.7）

## 交互

- 位置：日志详情抽屉「消息与预览」区块内，`messages` 展示区域下方。
- 控件：厂商（DeepSeek / 智谱）、智谱时 model 选择、可选「说明」多行文本（默认内置一句归纳类提示）、主按钮「发送到模型调试」。
- 结果：`Modal` 内流式追加正文，`pre` + `whitespace-pre-wrap`；错误时 `message.error` 或 Modal 内展示错误文案。

## 前端组装规则

- 若 `messages` 可解析为 `{ role, content }[]`（user/assistant/system + 非空字符串），则：`[...截断后的历史..., { role: 'user', content: 说明 }]`。
- 否则：单条 user，内容为说明 + 原始 JSON 代码块（与 PRD 一致）。
- 截断条数：优先取 `GET /api/config/public` 的 `maxMessagesInContext`，失败则用内置回退值；服务端再次按配置 `slice(-K)`。

## 与 `/api/chat` 的关系

- 不复用 `/api/chat` 路由；SSE 事件格式与现有前端解析保持一致（`delta` / `done` / `error`），便于共用解析逻辑。
