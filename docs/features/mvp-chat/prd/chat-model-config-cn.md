# Chat 模型展示与路由

> **English:** [chat-model-config.md](./chat-model-config.md)  
> **中文：** [chat-model-config-cn.md](./chat-model-config-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-05  
> **关联 Console PRD：** [console/prd/models-cn.md](../../console/prd/models-cn.md) · [console/prd/profile-cn.md](../../console/prd/profile-cn.md)

---

## 1. 范围

F-15 — Chat 界面展示 Profile Preferences 中的 provider + model；`POST /api/chat` 使用对应已通过测试的配置与 Key。

---

## 2. 用户故事


| ID    | 故事                                      | 优先级 |
| ----- | --------------------------------------- | --- |
| US-35 | 作为用户，Chat 界面能看到当前使用的 provider 和 model   | P0  |
| US-21 | 作为用户，对话 LLM 调用使用我在 Profile 中选择的已通过测试的模型 | P0  |


---

## 3. F-15 Chat 模型集成

### 3.1 展示（modelLabel）

**位置（与 iter-03/04 一致）：**

- Chat 主栏 / 会话区展示的 model 标签（`ConversationSession.modelLabel` 或等价）

**规则（iter-05）：**


| 项                                               | 规则                                       |
| ----------------------------------------------- | ---------------------------------------- |
| 数据来源                                            | Profile Preferences 所选 **Passed** 用户模型配置 |
| 格式（English）                                     | `{model name} ({provider})`              |
| 示例                                              | `qwen3.6-plus (bailian)`                 |
| 未设置 Preferences                                 | 回退第一条 **Passed + Enabled** 平台 chat 模型（iter-12）；见 [admin/prd/models-cn.md](../../admin/prd/models-cn.md) |
| env `LLM_PROVIDER` / `NEXT_PUBLIC_LLM_PROVIDER` | **不再**驱动 Chat 展示 |
| env `BAILIAN_API_KEY` | **iter-12 废弃** |


**切换 Preferences 后：**

- 已打开 Chat 页：layout 注入或 refresh 后更新 label（与 iter-04 `preferredModel` 注入模式一致）
- 新消息使用更新后的配置

### 3.2 LLM 调用（`/api/chat`）

**解析顺序（iter-05；iter-12 修订平台 Key 来源）：**

1. Profile Preferences → 模型配置 ID（Passed）— 可为用户 BYOK 或平台模型
2. 无有效偏好 → 第一条 **Passed + Enabled** 平台 chat 模型
3. 解析 provider + model name + API Key：
  - 用户 BYOK → 解密 DB Key
  - 平台模型 → 解密平台模型表 Key（**废弃** env `BAILIAN_API_KEY`）

**禁止：**

- Untested / Failed 配置不得用于 Chat（服务端二次校验；即使客户端篡改 preference）

**不可用态：**

- 无 Passed 配置且平台 Key 缺失 → 503 + English 用户提示，引导 `/console/models` 或联系管理员

**不变（iter-03）：**

- 助理 `system_prompt` 仍来自所选助理
- 不支持按助理单独选模型（assistant.model 列不参与 iter-05 解析）

### 3.3 与 iter-04 的差异


| iter-04                                                      | iter-05                          |
| ------------------------------------------------------------ | -------------------------------- |
| `resolveChatModelId(profile.preferred_model)` + env provider | 完整用户模型配置（provider + model + key） |
| `getDisplayModelLabel` 用 `NEXT_PUBLIC_LLM_PROVIDER`          | label 来自 Preferences 配置          |
| 全局 env API Key                                               | 每配置 Key + 平台默认 env Key           |


---

## 4. 验收标准

- [x] **AC-46** — Chat modelLabel 与 Profile Preferences 一致（格式 `{model} ({provider})`）
- [x] **AC-47** — Chat 使用用户 Key；平台默认使用 env `BAILIAN_API_KEY`
- [x] **AC-48** — Untested/Failed 配置不可用于 Chat（服务端拒绝）

---

## 5. 依赖

- [console/prd/models-cn.md](../../console/prd/models-cn.md) — 配置与测试状态
- [console/prd/profile-cn.md](../../console/prd/profile-cn.md) — Preferences 选择
- iter-04 — `app/chat/layout.tsx` 注入 preferred 配置；浏览器 session `modelLabel`

---

## 6. 修订记录


| 日期         | 变更                   |
| ---------- | -------------------- |
| 2026-06-17 | iter-05 初稿 — PRD 已确认 |
| 2026-07-12 | iter-12 — §3.1/3.2 平台模型与 Key 来源；废弃 `BAILIAN_API_KEY` |


