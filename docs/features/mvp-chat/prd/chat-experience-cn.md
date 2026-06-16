# Chat 体验（删除 · Markdown · 助理提示词）

> **English:** [chat-experience.md](./chat-experience.md)  
> **中文：** [chat-experience-cn.md](./chat-experience-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-02

---

## 1. 范围

F-09（system_prompt 修订）、F-12 删除对话、F-13 Markdown 渲染、F-14 清空当前对话消息。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-09 | 删除不需要的对话 | P0 |
| US-10 | 用户与 AI 消息 Markdown 展示（含代码块） | P0 |
| US-11 | 清空当前对话的全部消息，保留对话条目 | P1 |

---

## 3. F-09 默认助理 system_prompt（iter-02）

**English，seed / migration 更新：**

- 身份：7ai-club AI assistant
- **输出 Markdown**：标题、列表、粗体、行内代码、fenced code blocks
- 匹配用户语言；简洁结构化

> You are the AI assistant for 7ai-club. Reply in Markdown: use headings, lists, bold, inline code, and fenced code blocks when helpful. Match the user's language. Be clear and concise.

---

## 4. F-12 删除对话

- 侧边栏每条对话旁删除按钮
- 确认文案（English）：「Delete this conversation? This cannot be undone.」
- 硬删除；RLS 仅本人
- 删除当前对话：跳转最近一条或新建/空态

---

## 5. F-13 Markdown 渲染

- **用户 + AI** 消息均渲染
- P0：段落、标题、列表、 emphasis、行内/ fenced code、链接（`target="_blank"` + `rel="noopener"`）
- **流式 v1：** 单条 assistant 消息流式**结束后**再渲染 MD（非增量 parse）
- 安全：`rehype-sanitize`，禁止 raw HTML

---

## 6. F-14 清空聊天记录

- **范围：** 当前对话内的全部消息；**不**删除侧边栏对话条目
- **入口：** Chat 子栏右侧 **Clear chat**（助理标题左对齐）
- **确认文案（English）：**「Clear chat history? All messages in this conversation will be removed. This cannot be undone.」
- 硬删除 `messages` 行；RLS 仅本人
- 清空后：对话区回到空态；对话标题重置为 `New Chat`
- 流式或提交中禁用按钮

---

## 7. UI 状态

- 删除确认模态（blocking）
- 清空确认模态（blocking）
- 流式中可纯文本，完成后 MD

---

## 8. 验收标准

- [x] **AC-14**：删除需确认；DB 删除；仅本人
- [x] **AC-15**：删除当前对话后合理跳转
- [x] **AC-16**：AI fenced code block 正确展示
- [x] **AC-17**：用户 Markdown 正确渲染
- [x] **AC-21**：Clear chat 需确认；仅删当前对话消息；标题重置；流式中禁用

---

## 9. 迭代内 UX 增强（已实现）

| 项 | 说明 |
|----|------|
| 侧栏卡片 | 标题 + assistant name + `YYYY-MM-DD HH:mm` |
| 侧栏刷新 | 每轮对话 `router.refresh()` |
| 子栏 | 助理左对齐；Clear chat 图标与发送按钮右栏对齐 |
| 输入框 | 2 行；右下角悬浮 neon 发送按钮 |
| Thinking | 脉冲点 + `Thinking.` / `..` / `...`（450ms） |
| New chat | neon secondary 描边（非整片绿） |

---

## 10. 开放问题（已决）

| ID | 决议 |
|----|------|
| OQ-05 | 侧边栏删除 + 二次确认 |
| OQ-06 | 用户 + AI 双向 MD |
| OQ-07 | 首版消息完成后渲染 MD |

---

## 11. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-15 | iter-02 从总纲拆出 |
| 2026-06-16 | F-14 清空聊天；侧栏卡片与 UX 增强；本地实现完成 |
