# Assistants — 技术设计

> **English:** [assistants.md](./assistants.md)  
> **中文:** [assistants-cn.md](./assistants-cn.md)  
> **总纲:** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **迭代:** iter-03（已交付）

---

## 1. Schema 迁移

| 文件 | 内容 |
|------|------|
| `20260617000000_console_user_profiles_assistants.sql` | `user_profiles`；`assistants.user_id`；RLS |
| `20260617100000_assistant_icon_opening.sql` | `assistants.icon`、`assistants.opening_message` |

- `assistants` 增加 `user_id UUID REFERENCES auth.users`
- 删除全局 `assistants_single_default_idx`
- RLS policy `assistants_select_own_or_legacy`：用户自有行 **或** `user_id IS NULL`（legacy 会话解析）
- 平台模板行 `user_id NULL`；API 列表按 `user_id = auth.uid()` 过滤，UI 不可见

同文件包含 `user_profiles` 表（见 [profile-cn.md](./profile-cn.md)）。

---

## 2. Seed

`lib/console/assistants.ts` → `ensureUserAssistants(userId)`：

无助理时从 `user_id IS NULL AND is_default` 模板复制一条 `"7ai Assistant"`。

---

## 3. API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/assistants` | 列表；空则 seed |
| POST | `/api/assistants` | `{ name, systemPrompt, icon?, openingMessage? }` |
| PATCH | `/api/assistants/[id]` | 更新全部字段 |
| DELETE | `/api/assistants/[id]` | 有对话 → 409 |

校验：`lib/console/assistant-fields.ts`。

---

## 4. UI

`AssistantsManager`：表格（Icon、Name、Opening preview、Updated、Actions）+ 内嵌 `<dialog>` 表单 + 删除确认。

---

## 5. 历史数据

旧对话可仍引用全局助理 id；新对话仅允许用户自有助理 id。

---

## 6. 文件

| 操作 | 路径 |
|------|------|
| 新增 | migrations、`lib/console/assistants.ts`、`lib/console/assistant-fields.ts` |
| 新增 | `app/api/assistants/**`、`components/console/assistants-manager.tsx` |
| 新增 | `app/console/assistants/page.tsx` |

---

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 初稿 |
| 2026-06-16 | icon/opening migration；RLS legacy；标记已交付 |
