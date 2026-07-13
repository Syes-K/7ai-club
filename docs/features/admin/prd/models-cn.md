# 平台免费模型

> **English:** [models.md](./models.md)  
> **中文：** [models-cn.md](./models-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-12

---

## 1. 范围

F-32 — `/admin/models`：管理员 CRUD 7ai 向全体用户提供的**免费模型**；替代原虚拟 `PLATFORM_DEFAULT` 行与 env `BAILIAN_API_KEY`（**完全废弃**）。

普通用户在 **Profile Preferences** 与 **Console Models** 列表中可见并选用 **Passed** 的平台模型（与用户 BYOK 并列）。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-44 | 作为管理员，我希望配置多条平台免费模型，以便灵活运营 LLM 供给 | P0 |
| US-45 | 作为管理员，我希望测试模型连通性，确保仅可用模型对用户可见 | P0 |
| US-46 | 作为用户，我可在 Profile 中选择平台免费模型进行聊天 | P0 |
| US-47 | 作为用户，我的 BYOK 模型配置不受平台模型管理影响 | P0 |

---

## 3. F-32 Platform Models 页

### 3.1 路由与布局

- 路由：`/admin/models`
- 页面标题（English）：**Platform models**
- 主区：配置列表 + **Add model** 入口
- UI 交互参考 `/console/models`（`ModelsManager` 模式）

### 3.2 支持的 Provider（MVP）

与 Console Models 一致：

| Provider ID | 展示名（English） |
|-------------|-------------------|
| `bailian` | Bailian |
| `deepseek` | DeepSeek |
| `siliconflow` | SiliconFlow |
| `openai` | OpenAI |

**Out of Scope：** Anthropic、Azure、自定义 base URL。

### 3.3 配置项（每条平台模型）

| 字段 | 说明 |
|------|------|
| Display name | 可选友好名（English）；列表展示；缺省用 provider + model name |
| Provider | 四选一 |
| Model name | 如 `qwen3.6-plus` |
| API Key | 加密存 DB（AES，与用户 BYOK 同机制）；Admin UI 永不回显明文 |
| Model type | `chat`（默认）· `embedding` · …（与 Console 枚举一致） |
| Embedding dimensions | `type=embedding` 时必填 |
| Enabled | 布尔；`false` 时用户不可选，但 Admin 可见 |
| Sort order | 整数；Profile / 用户 Models 列表排序（升序） |
| Test status | `Untested` · `Passed` · `Failed` |
| Tested at | 最近测试时间 |
| Test error | Failed 时英文摘要 |

### 3.4 列表展示（English UI）

每行：**Display name**（或 provider + model）、Provider、Model name、Type、Enabled 徽章、Test status、Actions。

操作：**Edit** · **Test** · **Update API key** · **Disable/Enable** · **Delete**

**空态：** *"No platform models yet. Add a model to offer free LLM access."* + **Add model**

### 3.5 Add / Edit 表单

与 Console Models 对齐：

| 字段 | Add | Edit |
|------|-----|------|
| Display name | 可选 | 可改 |
| Provider | 必填 | 可改 → 重置 Untested |
| Model name | 必填 | 可改 → 重置 Untested |
| Model type | 必填，默认 chat | 可改 |
| Embedding dimensions | embedding 必填 | 可改 |
| API Key | 必填 | 独立 **Update API key** 流程 |
| Enabled | 默认 true | 可改 |
| Sort order | 默认 0 | 可改 |

### 3.6 模型测试（Test）

- 行为同 Console Models §3.8：最小 completion；Passed / Failed 持久化
- **仅 Passed 且 Enabled** 的平台模型对用户可选

### 3.7 删除

- 确认对话框
- 若仍有用户 Profile `preferred_model_config_id` 指向该平台模型（技术设计定 FK 或引用方式）→ **禁止删除**，英文：*"This model is selected by N user(s). Disable it instead."*
- 技术设计可优先用 **Disable** 代替硬删

### 3.8 迁移（自 iter-05 虚拟默认）

| 项 | 规则 |
|----|------|
| 数据源 | 废弃 `BAILIAN_API_KEY`、`PLATFORM_DEFAULT_CONFIG_ID` 虚拟注入 |
| Seed | Migration 将原 Bailian `qwen3.6-plus` 写入平台模型表（若 env 曾有 Key，**不**自动导入 env 值 — 管理员须在 Admin UI 录入 Key） |
| 用户偏好 | `preferred_model_config_id IS NULL` 的旧语义 → 技术设计映射到「第一条 Passed + Enabled 平台 chat 模型」或显式迁移 |
| Console Models 页 | 用户视图：平台模型区标记 **Platform**；只读，无 Edit/Delete |
| Profile | 下拉含 Passed 平台模型 + 用户 Passed BYOK |
| RAG Embedding | 平台 embedding 模型同理；替代 env `RAG_EMBEDDING_*` 作为「Platform default」首选（若本迭代一并迁移，见技术设计；否则列为 OQ） |

### 3.9 权限

| 操作 | 管理员 | 普通用户 |
|------|--------|----------|
| Admin CRUD | 是 | 否 |
| 查看平台模型列表（Console） | — | 是（只读） |
| 选用 Passed 平台模型 | — | 是 |
| Chat 使用平台模型 Key | — | 是（服务端解密） |

---

## 4. 验收标准

- [ ] **AC-127** — 管理员可 CRUD 平台模型（含 Key 加密存储）
- [ ] **AC-128** — 管理员可 Test；仅 Passed + Enabled 对用户可见可选
- [ ] **AC-129** — 普通用户 Profile 可选 Passed 平台模型
- [ ] **AC-130** — Console Models 展示平台模型为只读 **Platform** 行
- [ ] **AC-131** — Chat 使用所选平台模型解密 Key 完成对话
- [ ] **AC-132** — `BAILIAN_API_KEY` 与虚拟 `PLATFORM_DEFAULT` 代码路径已移除
- [ ] **AC-133** — 用户 BYOK 增删改测不受影响

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-12 | 初稿；确认完全废弃 BAILIAN_API_KEY |
