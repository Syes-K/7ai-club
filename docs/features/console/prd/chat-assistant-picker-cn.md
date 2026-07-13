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

> **iter-12 起 superseded：** 不再执行 seed。零个人助理时列表仍含 Enabled 系统助理（排后）；可选引导链到 `/console/assistants`。见 [admin/prd/assistants-cn.md](../../admin/prd/assistants-cn.md) §4。

- ~~执行 seed（见 assistants §3.4），再展示含一条的列表~~（已废弃）
- 无个人助理：可选 *"No personal assistants yet."* + 链到 Console；系统助理仍在列表后部可选
- seed 失败路径移除（iter-12）

### 3.2 iter-12 — 聚合选择器

> 完整规格：[admin/prd/assistants-cn.md](../../admin/prd/assistants-cn.md) §4（F-34）

**单列表**（无 Tab）合并：

| 顺序 | 内容 |
|------|------|
| **前** | 个人助理（`user_id = auth.uid()`） |
| **后** | 系统助理（`is_platform = true` 且 Enabled） |

- 系统助理行展示 **Platform** 徽章
- 须选择一项后 **Create**；LLM 模型仍来自 Profile 偏好

### 3.3 已有对话

- 不变：仍绑定原 `assistant_id`（含历史全局助理）

### 3.4 切换对话（iter-03 架构）

- `ChatAppShell` 客户端调用 `GET /api/conversations/[id]/session` 加载消息与助理元数据
- 侧栏持久；`ChatNavigationFeedback` 提供 loading / 超时反馈
- iter-04 计划改为浏览器 Supabase，移除 session BFF

---

## 4. 验收标准

- [x] **AC-09** — New Chat 弹出选择器；未选不能创建
- [x] **AC-10** — 新对话使用所选 system prompt + Profile 模型偏好

### iter-12

- [ ] **AC-135** — 单列表聚合；个人在前、系统在后（见 [admin/changelog/iter-12-cn.md](../../admin/changelog/iter-12-cn.md)）
- [ ] **AC-136** — 可选择系统助理创建对话

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 初稿 |
| 2026-06-16 | 补充 opening message、ChatAppShell；标记已交付 |
| 2026-07-12 | iter-12 — §3.2 聚合列表；§3.1 seed superseded |
