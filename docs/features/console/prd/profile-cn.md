# Profile

> **English:** [profile.md](./profile.md)  
> **中文：** [profile-cn.md](./profile-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-03

---

## 1. 范围

F-21 — `/console/profile`：邮箱只读、nickName 可编辑、对话模型偏好。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-20 | 作为已登录用户，我希望设置 nickName，以便在全站以昵称展示 | P0 |
| US-21 | 作为已登录用户，我希望选择偏好的对话模型，以便新对话使用该模型 | P0 |

---

## 3. F-21 Profile

### 3.1 字段

| 字段 | 可编辑 | 来源 |
|------|--------|------|
| Email | 否 | Supabase Auth |
| Nickname | 是 | `user_profiles.nickname` |
| Preferred model | 是 | `user_profiles.preferred_model` |

### 3.2 nickName 展示

设置 nickName 后，在**顶栏**（Chat/Console 页面 md+ 屏幕显示短标签）与 **UserMenu** 中优先展示（为空则回退邮箱 local-part / 完整邮箱）。

Landing 首页使用 `compactUserMenu`（仅头像），不显示短标签。

头像 initials：仍从邮箱生成（不变）。

### 3.3 模型选择

- 下拉列表为当前 `LLM_PROVIDER` 的**精选模型**（代码常量 3–5 个 model id）
- 保存写入 profile；作用于**新**对话的 LLM 调用
- 展示文案：model id + 提供商名（English）

### 3.4 交互

- **Save** 保存
- 成功提示（toast 或行内 “Saved”）
- 校验：nickName 最长 32 字符；trim；空字符串视为清除 nickName

---

## 4. 验收标准

- [x] **AC-04** — 邮箱只读；nickName 保存后在 Chat/Console 顶栏与 UserMenu 展示
- [x] **AC-05** — 模型偏好保存后，新对话使用新模型

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-16 | 初稿 |
| 2026-06-16 | 明确 compact vs 全顶栏；标记已交付 |
