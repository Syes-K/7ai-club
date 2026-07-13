# 平台 Assistant

> **English:** [assistants.md](./assistants.md)  
> **中文：** [assistants-cn.md](./assistants-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-12

---

## 1. 范围

F-33 — `/admin/assistants`：管理员 CRUD **系统助理**（`is_platform = true`），全体用户可在 New Chat **聚合列表**中选用（排在个人助理之后）。

F-34 — **New Chat 助理选择器**改版：**单列表聚合**个人 + 系统助理（系统默认排后）；**移除**自动 seed 复制逻辑。

平台助理字段与 Console 私有助理一致：**不含** per-assistant model（Chat 使用 Profile 模型偏好）。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-48 | 作为管理员，我希望配置系统助理，以便所有用户获得统一官方人设 | P0 |
| US-49 | 作为用户，我希望在 New Chat 中选择系统助理开始对话 | P0 |
| US-50 | 作为用户，我希望在个人助理与系统助理之间清晰区分 | P0 |
| US-51 | 作为用户，零个个人助理时仍可在列表后部选系统助理创建对话 | P0 |

---

## 3. F-33 Platform Assistants 页

### 3.1 路由与布局

- 路由：`/admin/assistants`
- 页面标题（English）：**Platform assistants**
- UI 参考 `/console/assistants`（`AssistantsManager` 模式）

### 3.2 数据模型（产品层）

| 字段 | 说明 |
|------|------|
| `is_platform` | `true` — 系统助理；仅管理员可写 |
| `user_id` | `NULL`（平台级） |
| `is_default` | 废弃自动 seed 后，平台助理**不再**使用 `is_default` 驱动复制；可保留列但 iter-12 不依赖 |

### 3.3 列表

表格：**Icon**、**Name**、**Opening message**（截断）、**Enabled**、最后更新时间、Actions。

**空态：** *"No platform assistants yet. Create one for all users."* + **Create assistant**

### 3.4 新增 / 编辑

与 Console Assistants 字段对齐：

| 字段 | 必填 | 说明 |
|------|------|------|
| Name | 是 | English；最长 64 字符 |
| Icon | 否 | emoji，最长 16 字符 |
| Opening message | 否 | 最长 2000 字符 |
| System prompt | 是 | 多行文本 |
| Enabled | 是 | 默认 `true`；`false` 时不在用户选择器列表中展示 |

**本迭代不含：** Knowledge bases 多选、MCP、per-assistant model。

### 3.5 删除

- 确认对话框
- 若存在 `conversations.assistant_id` 引用该平台助理 → **禁止删除**（409）
- 英文：*"This assistant is used in N chat(s). Disable it instead."*
- 建议优先 **Disable** 而非硬删

### 3.6 权限

| 操作 | 管理员 | 普通用户 |
|------|--------|----------|
| Admin CRUD | 是 | 否 |
| 查看 Enabled 系统助理 | — | New Chat 聚合列表（个人之后） |
| 编辑 / 删除系统助理 | — | 否 |
| 选用系统助理创建对话 | — | 是 |

---

## 4. F-34 New Chat 选择器改版

### 4.1 聚合列表（无 Tab）

模态框**单列表**合并两类助理（English UI）：

| 顺序 | 内容 | 规则 |
|------|------|------|
| **前** | 个人助理 | `user_id = auth.uid()` |
| **后** | 系统助理 | `is_platform = true` 且 Enabled |

- **不分 Tab**；同一列表内滚动选择
- 系统助理默认排在个人助理**之后**（组内排序：技术设计定，建议 `updated_at` 降序或 name 升序）
- 零个人助理时：列表仍展示 Enabled 系统助理；顶部可选引导 *"No personal assistants yet."* + 链到 `/console/assistants`（不阻塞选系统助理）

### 4.2 列表项

每行：Icon + Name（与现有一致）。**系统助理**行展示 **Platform** 徽章（English）；个人助理无徽章。

可选 P1：个人区与系统区之间**细分隔线**或静态小标题 *"System assistants"*（**非 Tab**，仅视觉分组）。

### 4.3 选择与创建

- 用户在**同一列表**中选择一个助理后 **Create**
- `POST /api/conversations` 携带 `assistantId`（平台或个人助理 UUID）
- Opening message 规则不变：有则写入首条 assistant 消息
- LLM 模型来自 **Profile 偏好**（非助理字段）

### 4.4 移除自动 Seed

| 旧行为 | 新行为 |
|--------|--------|
| 零个人助理时 RPC `ensure_user_assistants` 从模板复制 | **不再复制** |
| 平台模板 `user_id IS NULL` + `is_default` | 迁移为 `is_platform = true` 行；Admin 管理 |
| 无个人助理 | 列表展示 Enabled 系统助理（排后）；可选引导创建个人助理 |
| 用户零 Personal 仍想聊天 | 在同一列表中选择系统助理（无需切换 Tab） |

### 4.5 已有对话

- 不变：历史对话仍绑定原 `assistant_id`（含已删除/禁用的平台助理 — 技术设计定只读展示策略）

### 4.6 Console Assistants 页

- 仅管理**个人**助理；不展示系统助理
- 文档 [console/prd/assistants-cn.md](../../console/prd/assistants-cn.md) §3.4 自动 Seed **superseded** by 本文 §4.4

---

## 5. 验收标准

- [ ] **AC-134** — 管理员可 CRUD 平台助理（含 Enabled）
- [ ] **AC-135** — New Chat **单列表**聚合个人 + 系统助理；个人在前、系统在后
- [ ] **AC-136** — 用户可选择 Enabled 系统助理并创建对话
- [ ] **AC-137** — 不再执行自动 seed 复制；`ensure_user_assistants` 复制逻辑移除或改为 no-op
- [ ] **AC-138** — 列表前半为个人助理、后半为系统助理（`is_platform`）
- [ ] **AC-139** — 平台助理对话使用 Profile 模型偏好（非 per-assistant model）
- [ ] **AC-140** — 禁用平台助理不出现在列表中
- [ ] **AC-141** — 非管理员无法访问 admin assistants API

---

## 6. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-12 | 初稿；确认 is_platform、废弃 seed |
| 2026-07-12 | F-34 改为单列表聚合（个人在前、系统在后）；取消双 Tab |
