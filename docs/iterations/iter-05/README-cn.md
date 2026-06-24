# iter-05 — 用户模型配置与 Profile 偏好

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **迭代 ID：** `iter-05`  
> **状态：** **已发布**  
> **路线图阶段：** 1 — MVP 聊天 + 配置 UI  
> **计划发布：** —  
> **实际发布：** 2026-06-24  
> **Git tag（可选）：** `iter-05`

---

## 1. 迭代目标

- [x] Console **Models** 页落地：用户可配置 provider + model name + API Key，测试通过后方可消费
- [x] **Profile** 重构为 Account / Preferences 双 Card（View → Edit → 独立 Save）
- [x] **Chat** 展示并使用 Profile 中选定的已通过测试的 provider + model
- [x] 平台默认 **Bailian `qwen3.6-plus`**（env `BAILIAN_API_KEY`）对所有用户可用

---

## 2. 范围

### In Scope

| 区域 | 变更 |
|------|------|
| Console Models | CRUD、API Key 加密存储、独立 Update key、模型测试、平台默认项 |
| Console Profile | 双 Card、Detail/Edit 模式、Preferences 下拉（仅 Passed） |
| Chat | modelLabel 来自用户配置；`/api/chat` 使用对应 Key |
| 技术设计 | 待用户确认后编码 |
| 测试 | 单元 + E2E（实现阶段由 qa-engineer 执行） |

### Out of Scope

- 技术设计（待用户指令启动 fullstack-developer）
- 知识库 / MCP
- Anthropic / Azure OpenAI / Custom OpenAI-compatible provider
- 按助理单独选模型
- 组织/多租户、限流、成本监控
- 删除 env 全局 Provider（仍作平台默认 Key 来源）

---

## 3. 包含的 Features

| Slug | Changelog | 状态 |
|------|-----------|------|
| `console` | [changelog/iter-05-cn.md](../../features/console/changelog/iter-05-cn.md) | 已发布 |
| `mvp-chat` | [changelog/iter-05-cn.md](../../features/mvp-chat/changelog/iter-05-cn.md) | 已发布 |

**必读 PRD：**

1. [console/prd/models-cn.md](../../features/console/prd/models-cn.md)
2. [console/prd/profile-cn.md](../../features/console/prd/profile-cn.md)（iter-05 修订）
3. [mvp-chat/prd/chat-model-config-cn.md](../../features/mvp-chat/prd/chat-model-config-cn.md)

---

## 4. 验收

### 4.1 自动化

- [x] `pnpm lint` 通过
- [x] `pnpm build` 通过
- [x] `pnpm test` 通过（27/27）
- [x] `pnpm test:e2e` 通过

### 4.2 手工 QA

见 [console changelog §5](../../features/console/changelog/iter-05-cn.md) — 已通过。

### 4.3 发布

- [x] changelog AC-40–48 已全部勾选
- [x] 用户确认：`测试已通过，可发布`

---

## 5. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | iter-04 浏览器数据层、iter-03 Console 壳 |
| 风险 | API Key 加密方案须技术设计确认；测试接口可能受 provider 限流影响 |
| 缓解 | Key 仅 Node 解密；测试用最小 completion；超时与错误摘要可观测 |

---

## 6. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-17 | 编码实现完成；待 qa-engineer 验收 |
| 2026-06-24 | QA 通过；迭代已发布 |
