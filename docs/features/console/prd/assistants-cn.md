# Assistants

> **English:** [assistants.md](./assistants.md)  
> **中文：** [assistants-cn.md](./assistants-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-03（已交付）

---

## 1. 范围

F-22 — `/console/assistants`：每用户拥有**多个**助理；支持新增、编辑、删除（带保护）。

iter-03 交付时扩展 **Icon（emoji）** 与 **Opening message**（见 §3.2）。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-22 | 作为用户，我希望用名称和系统提示词创建助理，以便定制行为 | P0 |
| US-23 | 作为用户，我希望编辑或删除未使用的助理，以便管理列表 | P0 |
| US-25 | 作为用户，我希望为助理设置图标和开场白，以便在聊天中识别并自动展示欢迎语 | P1 |
| US-99 | 作为用户，我希望为助理挂载多个知识库，以便对话时检索资料 | P0 |

---

## 3. F-22 Assistants

### 3.1 列表

- 表格：**Icon**、**Name**、**Opening message**（截断预览）、最后更新时间、Actions
- 空态：引导创建第一个助理 + **Create assistant** 按钮

### 3.2 新增 / 编辑

| 字段 | 必填 | 说明 |
|------|------|------|
| Name | 是 | UI 英文；最长 64 字符 |
| Icon | 否 | emoji 文本，最长 16 字符；Chat 侧栏/消息/选择器展示 |
| Opening message | 否 | 最长 2000 字符；创建对话时写入首条 `assistant` 消息 |
| System prompt | 是 | 多行文本；列表不展示，仅在表单编辑 |
| Knowledge bases | 否 | 多选；仅 **Ready** 状态 KB（iter-09）；详见 [knowledge-base/prd/assistant-kb-binding-cn.md](../../knowledge-base/prd/assistant-kb-binding-cn.md) |

**本迭代不含：** 每助理 model、MCP。

### 3.3 删除

- 确认对话框
- 若存在 `conversations.assistant_id` 引用 → **禁止删除**（HTTP 409）
- 错误文案（English）：如 *"This assistant is used in N chat(s). Delete those chats first."*

### 3.4 自动 Seed

> **iter-12 起 superseded：** 不再从平台模板复制个人助理。零个人助理时 Console 展示空态；用户通过 New Chat **聚合列表**（后部）选用平台助理。详见 [admin/prd/assistants-cn.md](../../admin/prd/assistants-cn.md) §4.4。

用户**零个**个人助理时（iter-05 及以前行为，**已废弃**）：

- 服务端从平台模板（`user_id IS NULL`、`is_default = true`）复制 → 用户第一条 `"7ai Assistant"`

### 3.5 权限

- 用户仅可见/操作 `user_id = auth.uid()` 的行（**个人助理**）
- 平台助理（`is_platform = true`）**不出现在** Console 列表；由 `/admin/assistants` 管理（iter-12）

---

## 4. 验收标准

- [x] **AC-06** — 可新增助理（Name + System prompt；可选 Icon/Opening）
- [x] **AC-07** — 可编辑已有助理
- [x] **AC-08** — 无对话时可删；有对话时阻止并提示

### iter-09

- [ ] **AC-95** — 助理表单可多选 Ready 知识库（见 [knowledge-base/changelog/iter-09-cn.md](../../knowledge-base/changelog/iter-09-cn.md)）

### iter-12（交叉修订）

- [ ] **AC-137** — 移除自动 seed；Console 仅管理个人助理（见 [admin/changelog/iter-12-cn.md](../../admin/changelog/iter-12-cn.md)）

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 初稿 — 多助理 |
| 2026-06-16 | 补充 Icon、Opening message；标记 iter-03 已交付 |
| 2026-06-30 | iter-09 — Knowledge bases 多选绑定 |
| 2026-07-12 | iter-12 — §3.4 seed superseded；§3.5 区分个人/平台助理 |
