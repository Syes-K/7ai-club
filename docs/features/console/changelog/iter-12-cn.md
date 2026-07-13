# iter-12 变更摘要 — console（admin 交叉修订）

> **English:** [iter-12.md](./iter-12.md)  
> **中文：** [iter-12-cn.md](./iter-12-cn.md)  
> **迭代索引：** [iter-12/README-cn.md](../../iterations/iter-12/README-cn.md)  
> **主 Feature changelog：** [admin/changelog/iter-12-cn.md](../../admin/changelog/iter-12-cn.md)

---

## 1. 主题

本文件记录 **iter-12（admin）** 对 Console 的交叉影响。Admin 新能力见 [admin feature](../../admin/README-cn.md)；此处仅列 Console 侧变更。


| 主题                   | PRD                                                                        | 设计 |
| -------------------- | -------------------------------------------------------------------------- | ---- |
| Models 列表 — 平台行      | [prd/models-cn.md](../prd/models-cn.md) §7                                 | [design/models-cn.md](../design/models-cn.md) §14 |
| Profile Preferences  | [prd/profile-cn.md](../prd/profile-cn.md) §3.3                             | [design/models-cn.md](../design/models-cn.md) §14 |
| Assistants — 移除 seed | [prd/assistants-cn.md](../prd/assistants-cn.md) §3.4                       | [admin/design/platform-assistants-cn.md](../../admin/design/platform-assistants-cn.md) |
| New Chat 选择器         | [prd/chat-assistant-picker-cn.md](../prd/chat-assistant-picker-cn.md) §3.2 | [admin/design/integration-cn.md](../../admin/design/integration-cn.md) §4 |


**总纲修订：** [01-product-requirements-cn.md](../01-product-requirements-cn.md) §2.3–2.4（v0.4）

---



## 2. 必读

1. [admin/changelog/iter-12-cn.md](../../admin/changelog/iter-12-cn.md) — **主验收 AC-120–141**
2. [admin/01-product-requirements-cn.md](../../admin/01-product-requirements-cn.md)
3. 本 feature 子 PRD §7 / iter-12 增量段落（上表）
4. [iter-12/README-cn.md](../../iterations/iter-12/README-cn.md)

---



## 3. 计划交付（编码前）


| ID      | 区域                                            | 变更摘要                                        |
| ------- | --------------------------------------------- | ------------------------------------------- |
| C-12-01 | `app/console/models`                          | 合并展示平台模型只读行（**Platform** 徽章）；用户 BYOK 行为不变   |
| C-12-02 | `components/console/models-manager.tsx`       | 平台行无 Edit/Delete/Test/Update key            |
| C-12-03 | Profile Preferences                           | 下拉合并 Passed 平台 chat 模型 + 用户 BYOK            |
| C-12-04 | `components/console/assistants-manager.tsx`   | 仅 `user_id = auth.uid()`；移除 seed 触发         |
| C-12-05 | `components/chat/assistant-picker-dialog.tsx` | 单列表聚合个人 + 系统助理；系统排后        |
| C-12-06 | `lib/services/browser/assistants.ts`          | 列出平台助理；移除 / no-op `ensureUserAssistants` 复制 |
| C-12-07 | `lib/console/model-configs*.ts`               | 移除 `PLATFORM_DEFAULT` 虚拟注入；读平台模型表           |
| C-12-08 | 回归                                            | BYOK CRUD/Test、Profile Save、Console 导航不受影响  |


**废弃：** env `BAILIAN_API_KEY`、哨兵 `PLATFORM_DEFAULT_CONFIG_ID`、`ensure_user_assistants` 模板复制。

---



## 4. 产品决策（iter-12 已确认 · Console 侧）


| 项             | 决策                                        |
| ------------- | ----------------------------------------- |
| 平台模型在 Console | **只读**；CRUD 仅在 `/admin/models`            |
| 个人助理          | Console `/console/assistants` 不变（CRUD 本人） |
| 系统助理          | 不出现在 Console；New Chat 聚合列表（个人之后）   |
| 零个人助理         | 不再自动 seed；列表后部仍可选系统助理              |
| Chat 模型       | 仍来自 Profile；无 per-assistant model         |


---



## 5. 验收清单

> **勾选规则：** 主 AC 在 [admin/changelog/iter-12-cn.md](../../admin/changelog/iter-12-cn.md) §5 勾选。本节为 Console **回归** 索引。

- [x] **AC-129** — Profile 可选 Passed 平台模型（admin 主 AC）
- [x] **AC-130** — Console Models 只读 Platform 行
- [x] **AC-133** — 用户 BYOK 增删改测不受影响
- [x] **AC-135** — New Chat 单列表聚合；个人在前、系统在后
- [x] **AC-136** — 列表中可选择系统助理
- [x] **AC-137** — 移除自动 seed
- [x] **AC-138** — 列表顺序：个人条目在前、系统条目在后



### 5.1 Test Matrix（qa-engineer · Phase C0 填写）

| AC ID | 前提 | 操作步骤 | 期望结果 | 验证方式 | 自动化覆盖 | 证据 |
| ------ | ------------------------ | ---------------------------- | ------------------------------- | ------------ | ----- | --- |
| AC-130 | Admin 已配置 ≥1 Passed 平台模型 | 1. `/console/models` 2. 检查平台行操作按钮 | 见 **Platform** 只读行；BYOK 行可 Edit/Update key | e2e + manual | `tests/e2e/iter05-console-models.spec.ts` AC-40 · M-C12-01 | |
| AC-133 | 已有 BYOK Passed 配置 | 1. Add/Edit/Test/Delete BYOK | 与 iter-05 一致 | e2e | `tests/e2e/iter05-console-models.spec.ts` AC-41 | |
| AC-135 | 登录用户；含个人 + 系统助理 | 1. New chat | 单列表；个人在前、系统在后；系统行有 **Platform** 徽章 | e2e | `tests/e2e/iter12-console-chat.spec.ts` AC-135 · M-C12-02 | |
| AC-137 | 零个人助理新用户 | 1. New chat | 无 seed；列表后部仍有系统助理可选 | e2e + manual | `tests/e2e/iter12-console-chat.spec.ts` AC-137 · M-C12-03 | |


---



## 6. 门禁与阶段状态


| 阶段       | 状态                            | 日期         |
| -------- | ----------------------------- | ---------- |
| PRD 交叉修订 | 已落盘                           | 2026-07-12 |
| 技术设计     | [admin/02-technical-design-cn.md](../../admin/02-technical-design-cn.md) · [design/models-cn.md](../design/models-cn.md) §14 | 2026-07-12 |
| 编码       | Phase B 交付完成                  | 2026-07-12 |
| 测试 C0–C4 | Matrix 已落盘；§7 手工修复；C4 AC 勾选完成 | 2026-07-13 |
| 发布 | **已发布**（用户：`测试已通过，可发布` · 2026-07-13） | 2026-07-13 |


---

## 7. 交叉手工修复（iter-12 · 2026-07-13）

| ID | 关联 | 现象 | 修复 |
|----|------|------|------|
| H-01 | AC-129 | 新用户 Profile 默认模型未落库 | `ensureUserProfileDefaults`（Console layout） |
| H-02 | AC-129 | 平台模型下拉 label 不一致 | `formatPlatformModelLabel` 与 Models 表对齐 |
| H-03 | AC-131 | Disable 首条平台模型后 Chat/Profile 异常 | 偏好失效回退 + profile 同步（见 [admin §7](../../admin/changelog/iter-12-cn.md) H-03） |

---

## 12. 手工 QA 脚本（qa-engineer · Phase C0 填写，C3 执行）


| #        | 映射 AC  | 场景             | 前提           | 步骤                                  | 期望                     | 结果  | 证据  |
| -------- | ------ | -------------- | ------------ | ----------------------------------- | ---------------------- | --- | --- |
| M-C12-01 | AC-130 | Console 平台模型只读 | Admin 已配平台模型 | 1. `/console/models` 2. 尝试 Edit 平台行 | 无 Edit/Delete；BYOK 可操作 | pass | E2E AC-40 |
| M-C12-02 | AC-135 | 聚合选择器 | 已登录；有个人 + 系统助理 | 1. New chat | 单列表；系统助理在个人之后 | pass | E2E AC-135 |
| M-C12-03 | AC-137 | 无 seed | 零个人助理账号 | 1. New chat | 无自动创建；可选后部系统助理 | pass | E2E AC-137 |
| M-C12-04 | AC-129 | Profile 平台默认 | 新注册用户 | 1. 首次 `/console/profile` | 默认选中首条平台 Chat；label 含 `model_name` | pass | H-01 H-02 · 2026-07-13 |


---



## 13. 修订记录


| 日期         | 变更                              |
| ---------- | ------------------------------- |
| 2026-07-13 | §7 交叉手工修复 H-01–H-03；§12 M-C12 结果补全 |
| 2026-07-13 | 用户确认发布 |
| 2026-07-12 | 创建 console iter-12 交叉 changelog |
| 2026-07-12 | F-34 选择器改为单列表聚合（取消双 Tab） |


