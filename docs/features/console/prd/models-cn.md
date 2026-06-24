# Model 管理

> **English:** [models.md](./models.md)  
> **中文：** [models-cn.md](./models-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-05

---

## 1. 范围

F-24 — `/console/models`：用户 BYOK 模型配置、加密 API Key、连通性测试、平台默认项。

---

## 2. 用户故事


| ID    | 故事                                                         | 优先级 |
| ----- | ---------------------------------------------------------- | --- |
| US-30 | 作为用户，我能在 Models 页添加 provider + model name + API Key，并测试连通性 | P0  |
| US-31 | 作为用户，测试失败的配置不能在 Profile 和 Chat 中使用                         | P0  |
| US-32 | 作为用户，修改 Key 时有独立安全入口，列表中看不到明文                              | P0  |
| US-36 | 作为新用户，系统提供平台默认 Bailian qwen3.6-plus，可直接聊天                  | P0  |


---

## 3. F-24 Models 页

### 3.1 路由与布局

- 路由：`/console/models`
- 替换 iter-03 占位页（[placeholders-cn.md](./placeholders-cn.md) §3）
- 页面标题（English）：**Model management**
- 主区：配置列表 + **Add model** 入口

### 3.2 支持的 Provider（MVP）


| Provider ID   | 展示名（English） | 默认 Base URL（产品层，技术设计可覆盖）          |
| ------------- | ------------ | --------------------------------- |
| `bailian`     | Bailian      | DashScope compatible-mode         |
| `deepseek`    | DeepSeek     | DeepSeek OpenAI-compatible API    |
| `siliconflow` | SiliconFlow  | SiliconFlow OpenAI-compatible API |
| `openai`      | OpenAI       | OpenAI API                        |


**Out of Scope（本迭代）：** Anthropic、Azure OpenAI、用户自定义 OpenAI-compatible base URL。

### 3.3 配置项（每条记录）


| 字段               | 说明                                                  |
| ---------------- | --------------------------------------------------- |
| Provider         | 四选一                                                 |
| Model name       | 用户输入，如 `qwen3.6-plus`、`deepseek-chat`、`gpt-4o-mini` |
| API Key          | 每 Model **独立** Key；加密存 DB；**永不**在 API 响应或 UI 回显明文   |
| Test status      | `Untested` · `Passed` · `Failed`                    |
| Tested at        | 最近一次测试时间（可选展示）                                      |
| Test error       | Failed 时简短英文摘要（如 "Invalid API key"）                 |
| Platform default | 布尔；见 §3.5                                           |


### 3.4 列表展示（English UI）

每行至少展示：

- Provider 名 + Model name
- Key 状态：`Configured` / `Not set`（非明文）
- Test status 徽章：`Untested` / `Passed` / `Failed`
- 操作：**Edit** · **Test** · **Update API key** · **Delete**

**空态（除平台默认外无用户配置）：**

- 文案示例：「No custom models yet. Add a model to use your own API key.」
- **Add model** 按钮

### 3.5 平台默认配置


| 项           | 规则                                         |
| ----------- | ------------------------------------------ |
| Provider    | `bailian`                                  |
| Model name  | `qwen3.6-plus`                             |
| API Key     | **不存用户 Key**；运行时读取 env `BAILIAN_API_KEY`   |
| 可见性         | Models 页**可见**，标记 **Platform default**     |
| Key 编辑      | **不可**通过 UI 修改 Key（只读）                     |
| 删除          | **不可**删除                                   |
| Test status | 始终 **Passed**（或等效：不展示 Test 按钮 / 固定 Passed） |
| 新用户         | 首次使用须确保该配置对当前用户可用（seed / 虚拟注入 — 技术设计定）     |


### 3.6 Add / Edit 表单

**Add model：**


| 字段         | 必填  | 说明         |
| ---------- | --- | ---------- |
| Provider   | 是   | 下拉         |
| Model name | 是   | 文本；trim；非空 |
| API Key    | 是   | 密码输入；创建时必填 |


**Edit model（非平台默认）：**


| 字段         | 可改  | 说明                                     |
| ---------- | --- | -------------------------------------- |
| Provider   | 是   | 修改后 test status → `Untested`（须重新 Test） |
| Model name | 是   | 修改后 test status → `Untested`           |
| API Key    | —   | **不在此表单**；见 §3.7                       |


保存后若 provider 或 model name 变更，**Test status 重置为 Untested**。

### 3.7 Update API Key（独立流程）

- 入口：**Update API key** 按钮或 Edit 页内独立区块
- 交互：弹窗 / 抽屉；仅含新 Key 密码字段 + **Save key**
- 规则：
  - 列表与详情 API **不返回** Key 明文或密文
  - 保存新 Key 后 test status → `Untested`（须重新 Test 方可消费）
- 平台默认项：**无**此入口

### 3.8 模型测试（Test）

**触发：** 列表或编辑页 **Test** 按钮（平台默认无 Test 或禁用）。

**行为（产品层）：**

1. 调用服务端测试接口（Node Route Handler；须 `getUser()`）
2. 使用**该配置**的 provider + model name + Key（平台默认用 env Key）
3. 发送**最小 completion**（如 user message `"Hi"`）；收到**非空** assistant 响应 → **Passed**
4. 失败 → **Failed**，持久化简短英文 `test_error`；不清除 Key

**消费规则：**


| Test status | Profile 可选 | Chat 可用 |
| ----------- | ---------- | ------- |
| Passed      | 是          | 是       |
| Untested    | 否          | 否       |
| Failed      | 否          | 否       |


修改 provider / model name / API Key 后须重新 Test。

### 3.9 删除

- 用户配置：可删除
- 若该配置为 Profile 当前 Preferences 选中项：**禁止删除**（English 错误：「This model is your current preference. Choose another model in Profile first.」）
- 平台默认：不可删除

---

## 4. 权限与安全（产品层）


| 操作               | 谁可以            | 备注                     |
| ---------------- | -------------- | ---------------------- |
| 查看 Models 页      | 已登录用户          | 仅本人配置 + 平台默认           |
| CRUD 用户配置        | 本人             | RLS                    |
| 查看 API Key 明文    | **无人**（含本人 UI） | 仅 Configured / Not set |
| 测试 / Chat 使用 Key | 服务端 Node       | 解密后调用 provider         |
| 平台默认 Key         | 服务端 env        | `BAILIAN_API_KEY`      |


---

## 5. 非功能需求


| 类型  | 要求                                       |
| --- | ---------------------------------------- |
| 安全  | Key 加密存 DB；浏览器与 Supabase 直连层不暴露解密 Key    |
| 性能  | Test 请求超时与 Chat 同级量级（具体 ms 由技术设计定）       |
| 可用性 | Failed 展示可行动错误摘要；引导用户修正 Key 或 model name |


---

## 6. 验收标准

- [x] **AC-40** — Models 页 CRUD；Network 响应中无 API Key 明文或密文
- [x] **AC-41** — Update API key 独立流程；编辑 provider/model name 不覆盖 Key
- [x] **AC-42** — Test Passed 持久化；Failed 展示错误摘要；Untested/Failed 不可被 Profile 选中
- [x] **AC-47** — Chat 使用用户 Key；平台默认使用 env `BAILIAN_API_KEY`
- [x] **AC-48** — 修改 Key / provider / model name 后 status 重置为 Untested（平台默认除外）

---

## 7. 依赖与假设

### 7.1 依赖

- iter-04 浏览器分层（Profile CRUD 已迁 Supabase）
- `POST /api/chat` 保留 Node（LLM 密钥）

### 7.2 假设

- 四 provider 均提供 OpenAI-compatible chat completions（与现有 `lib/llm` 一致）
- 部署环境已配置 `BAILIAN_API_KEY` 作为平台默认

---

## 8. 开放问题


| ID    | 问题                           | 状态  | 决议             |
| ----- | ---------------------------- | --- | -------------- |
| OQ-01 | Key 加密：Vault vs 应用层 AES      | 开放  | 技术设计阶段决议       |
| OQ-02 | 新用户平台默认：DB seed vs 运行时虚拟行    | 开放  | 技术设计阶段决议       |
| OQ-03 | 同 provider + model name 重复添加 | 开放  | 建议禁止重复（技术设计确认） |


---

## 9. 修订记录


| 日期         | 变更                   |
| ---------- | -------------------- |
| 2026-06-17 | iter-05 初稿 — PRD 已确认 |


