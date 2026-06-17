# New Chat 助理选择器

> **English:** [chat-assistant-picker.md](./chat-assistant-picker.md)  
> **中文:** [chat-assistant-picker-cn.md](./chat-assistant-picker-cn.md)  
> **总纲:** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代:** iter-03（已交付）

---

## 1. 范围

F-23 — **New Chat** 必须先选助理再创建对话。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-24 | 作为用户，我希望新建对话时选择助理，以便对话使用对应人设 | P0 |

---

## 3. F-23 流程

1. 用户点击 **New chat**（侧栏或空态）
2. 弹出**模态框**，列出用户全部助理（Icon + Name）
3. 用户**必须选择**一个助理（仅 1 个时自动选中）
4. **Create** → `POST /api/conversations` 携带 `assistantId` → 跳转 `/chat/[id]`
5. 对话使用所选助理的 `system_prompt`；LLM 模型来自 Profile 偏好
6. 若助理配置了 **Opening message**，创建时写入首条 `assistant` 消息（用户可见，非 system prompt）

### 3.1 零助理

- 执行 seed（见 [assistants-cn.md](./assistants-cn.md) §3.4），再展示含一条的列表
- seed 失败则错误提示 + 链到 Console

### 3.2 已有对话

- 不变：仍绑定原 `assistant_id`（含历史全局助理）

### 3.3 切换对话（iter-03 架构）

- `ChatAppShell` 客户端调用 `GET /api/conversations/[id]/session` 加载消息与助理元数据
- 侧栏持久；`ChatNavigationFeedback` 提供 loading / 超时反馈
- iter-04 计划改为浏览器 Supabase，移除 session BFF

---

## 4. 验收标准

- [x] **AC-09** — New Chat 弹出选择器；未选不能创建
- [x] **AC-10** — 新对话使用所选 system prompt + Profile 模型偏好

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 初稿 |
| 2026-06-16 | 补充 opening message、ChatAppShell；标记已交付 |
