# Profile

> **English:** [profile.md](./profile.md)  
> **中文：** [profile-cn.md](./profile-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-03（基础）· **iter-05（Preferences 重构）**

---

## 1. 范围

F-21 — `/console/profile`：Account 信息 + Preferences（对话模型偏好）。

- **iter-03：** 邮箱只读、nickName、基于 env `LLM_PROVIDER` 的静态模型下拉
- **iter-05：** 双 Card、Detail/Edit 模式、Preferences 仅可选 Models 页 **Passed** 配置

---

## 2. 用户故事


| ID    | 故事                                      | 优先级 | 迭代      |
| ----- | --------------------------------------- | --- | ------- |
| US-20 | 作为用户，我希望设置 nickName，以便在全站以昵称展示          | P0  | iter-03 |
| US-21 | 作为用户，我希望选择偏好的对话模型，以便新对话使用该模型            | P0  | iter-03 |
| US-33 | 作为用户，我在 Preferences 里从已通过测试的模型中选择默认对话模型 | P0  | iter-05 |
| US-34 | 作为用户，Account 与 Preferences 分开保存，互不影响    | P0  | iter-05 |
| US-35 | 作为用户，Profile 默认展示详情，点击 Edit 才进入编辑       | P1  | iter-05 |


---

## 3. F-21 Profile

### 3.1 页面结构（iter-05）

两个 **Card** 垂直排列（English UI）：

```
┌─ Account ──────────────────────────────┐
│  View: email, nickname                 │
│  [Edit] → form → [Save] / [Cancel]     │
└────────────────────────────────────────┘

┌─ Preferences ──────────────────────────┐
│  View: current provider + model label  │
│  [Edit] → dropdown → [Save] / [Cancel] │
└────────────────────────────────────────┘
```

- 默认进入 **View（Detail）** 模式
- 各 Card **独立** Edit / Save / Cancel；保存 Account 不影响 Preferences，反之亦然
- 成功反馈：行内 **Saved.** 或 toast（与 iter-03 一致）

### 3.2 Account Card


| 字段       | 可编辑        | 来源                       |
| -------- | ---------- | ------------------------ |
| Email    | 否          | Supabase Auth            |
| Nickname | 是（Edit 模式） | `user_profiles.nickname` |


**nickName 展示（iter-03，不变）：**

设置 nickName 后，在**顶栏**（Chat/Console 页面 md+ 屏幕）与 **UserMenu** 中优先展示（为空则回退邮箱 local-part / 完整邮箱）。Landing 使用 `compactUserMenu`（仅头像）。

头像 initials：仍从邮箱生成。

**校验：** nickName 最长 32 字符；trim；空字符串视为清除 nickName。

### 3.3 Preferences Card（iter-05）


| 字段              | 可编辑        | 来源                               |
| --------------- | ---------- | -------------------------------- |
| Preferred model | 是（Edit 模式） | 引用 Models 页 **Passed** 配置（含平台默认） |


**View 模式展示（English）：**

- 格式：`{Provider label} — {model name}`
- 示例：`Bailian — qwen3.6-plus`

**Edit 模式 — 下拉：**

- 选项来源：**仅**当前用户 Models 列表中 `test_status = Passed` 的配置
- 选项格式：`{Provider label} — {model name}`
- 含平台默认 Bailian qwen3.6-plus（始终 Passed）
- **无** Passed 配置时（极端：平台 Key 未配置）：空态 + 链到 `/console/models`

**保存：**

- 持久化用户所选配置 ID（或等价 provider + model 引用 — 技术设计定）
- 作用于 **Chat LLM 调用**（非按助理 model 列；iter-03 约定不变）
- 移除 iter-03 基于 `LLM_PROVIDER` env 与代码常量的静态 `modelOptions` 列表

### 3.4 与 iter-03 的差异


| iter-03                          | iter-05              |
| -------------------------------- | -------------------- |
| 单表单、字段同页 Save                    | 双 Card、独立 Save       |
| 始终表单模式                           | 默认 Detail，Edit 切换    |
| 静态 modelOptions（env provider）    | Models 页 Passed 配置   |
| `preferred_model` 存 model id 字符串 | 存对用户模型配置的引用（技术设计定字段） |


---

## 4. 验收标准

### iter-03（已交付）

- [x] **AC-04** — 邮箱只读；nickName 保存后在 Chat/Console 顶栏与 UserMenu 展示
- [x] **AC-05** — 模型偏好保存后，新对话使用新模型（iter-03 静态列表；iter-05 由 AC-43/46 替代行为）

### iter-05

- [x] **AC-43** — Preferences 下拉仅含 Passed 配置（含平台默认）
- [x] **AC-44** — Account / Preferences 独立 Save，互不影响
- [x] **AC-45** — 默认 Detail 视图；Edit 切换表单；Cancel 恢复初始值

---

## 5. 修订记录


| 日期         | 变更                                               |
| ---------- | ------------------------------------------------ |
| 2026-06-16 | iter-03 初稿                                       |
| 2026-06-16 | 明确 compact vs 全顶栏；标记 iter-03 已交付                 |
| 2026-06-17 | iter-05 — 双 Card、Preferences 绑定 Models Passed 配置 |


