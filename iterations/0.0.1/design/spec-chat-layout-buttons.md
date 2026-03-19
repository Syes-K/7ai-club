# 设计说明：对话页模型位置与操作按钮（version=0.0.1）

**输入需求**：`iterations/0.0.1/product/prd-chat-layout-buttons.md`、`user-stories-chat-layout-buttons.md`  
**基线设计**：`docs/design/spec-ai-agent.md`

---

## 1. 设计决策

- 模型选择迁至**顶栏右侧工具区**，不再在 footer 输入框上方独占一行。
- Footer 仅保留 `textarea + 发送`。
- 发送/清空/重试统一线框图标，按钮采用图标+中文文案。
- `busy` 与禁用态逻辑保持一致：模型下拉、清空、发送按既有条件禁用。

---

## 2. 关键交互

- 顶栏：`模型<label + select>` + `清空对话`。
- 输入区：多行输入、`⌘/Ctrl + Enter` 发送。
- 错误态：错误气泡内展示 `重试` 按钮（带图标）。
- 空态文案改为「在顶栏选择模型后输入问题」。

---

## 3. 响应式与可访问性

- 顶栏 `flex-wrap`，窄屏时模型与清空可换行但保持可操作。
- 保留 `label` 与 `select` 关联，按钮保持可见焦点环。

---

## 4. 实现路径

- 主要文件：`src/components/chat/ChatApp.tsx`

---

## 5. 文档路径

- 主路径：`iterations/0.0.1/design/spec-chat-layout-buttons.md`
- 同步：`docs/design/spec-chat-layout-buttons.md`
