# 前端实现说明：迭代 0.0.1（对话页布局与按钮）

**version**：`0.0.1`  
**设计依据**：`iterations/0.0.1/design/spec-chat-layout-buttons.md`

---

## 1. 改动摘要

- 模型选择：由 footer 移至顶栏右侧，保留 `label + select`。
- Footer：仅保留 `textarea + 发送`。
- 图标：发送/清空/重试增加线框图标。
- 空态：文案改为「在顶栏选择模型后输入问题」。
- 响应式：顶栏支持换行，窄屏保持可操作。

---

## 2. 主文件

- `src/components/chat/ChatApp.tsx`

---

## 3. 文档路径

- 主路径：`iterations/0.0.1/frontend/implementation-notes-chat-layout-buttons.md`
- 同步：`docs/frontend/implementation-notes-chat-layout-buttons.md`
