# iter-12 变更摘要 — mvp-chat（admin 交叉修订）

> **English:** [iter-12.md](./iter-12.md)  
> **中文:** [iter-12-cn.md](./iter-12-cn.md)  
> **迭代索引：** [iter-12/README-cn.md](../../iterations/iter-12/README-cn.md)  
> **主 Feature changelog：** [admin/changelog/iter-12-cn.md](../../admin/changelog/iter-12-cn.md)

---

## 1. 主题

本文件记录 **iter-12（admin）** 对 Chat 模型解析与 New Chat 流程的交叉影响。

| 主题 | PRD | 设计 |
|------|-----|------|
| Chat modelLabel + `/api/chat` Key 来源 | [prd/chat-model-config-cn.md](../prd/chat-model-config-cn.md) | [design/chat-model-config-cn.md](../design/chat-model-config-cn.md) §10 |
| New Chat 聚合列表 | [console/prd/chat-assistant-picker-cn.md](../../console/prd/chat-assistant-picker-cn.md) §3.2 | [console/changelog/iter-12-cn.md](../../console/changelog/iter-12-cn.md) |

---

## 2. 必读

1. [admin/changelog/iter-12-cn.md](../../admin/changelog/iter-12-cn.md) — **主验收 AC-120–141**
2. [prd/chat-model-config-cn.md](../prd/chat-model-config-cn.md) — iter-12 修订段落
3. [console/changelog/iter-12-cn.md](../../console/changelog/iter-12-cn.md) — 选择器 / seed
4. [iter-12/README-cn.md](../../iterations/iter-12/README-cn.md)

---

## 3. 计划交付（编码前）

| 区域 | 变更摘要 |
|------|----------|
| `app/api/chat/route.ts` 及 workflow/stream | 平台模型 Key 从 DB 解密；**移除** `BAILIAN_API_KEY` 分支 |
| `lib/llm/` model 解析 | 统一：用户 BYOK 或 `platform_model_configs` Passed 行 |
| `app/chat/layout.tsx` | `modelLabel` 来自合并后的 Profile 配置（含平台模型） |
| `lib/services/browser/model-label.ts` | 移除虚拟 `PLATFORM_DEFAULT` 标签逻辑 |
| `POST /api/conversations` | 接受平台助理 `assistantId`（`is_platform = true`） |
| `components/chat/assistant-picker-dialog.tsx` | 单列表聚合（与 console changelog C-12-05 共享） |
| 单元 / E2E | 更新 AC-47 相关测试：平台 Key 不再来自 env |

**不变：** Assistant `system_prompt` 来自所选助理；**无** per-assistant model。

---

## 4. 产品决策（iter-12 · Chat 侧）

| 项 | 决策 |
|----|------|
| 平台模型 Key | DB AES 解密（同 BYOK 机制） |
| `BAILIAN_API_KEY` | **完全废弃** |
| 无偏好回退 | 第一条 Passed + Enabled 平台 chat 模型 |
| 无可用模型 | 503 + English 引导 `/console/models` 或联系管理员 |
| 系统助理对话 | 与私人助理相同 Chat 路径；模型仍走 Profile |

---

## 5. 验收清单

> 主 AC 勾选见 [admin/changelog/iter-12-cn.md](../../admin/changelog/iter-12-cn.md) §5。

- [x] **AC-131** — Chat 使用所选平台模型解密 Key 完成对话
- [x] **AC-132** — 移除 `BAILIAN_API_KEY` / 虚拟 `PLATFORM_DEFAULT` 代码路径
- [x] **AC-136** — 使用系统助理创建对话后 Chat 正常流式响应
- [x] **AC-139** — 平台助理对话使用 Profile 模型偏好
- [x] **AC-48**（回归）— Untested/Failed 配置仍被服务端拒绝

### 5.1 Test Matrix（qa-engineer · Phase C0 填写）

| AC ID | 前提 | 操作步骤 | 期望结果 | 验证方式 | 自动化覆盖 | 证据 |
|-------|------|----------|----------|----------|------------|------|
| AC-131 | Profile 选 Passed 平台模型 | 1. `/chat` 发消息 | 流式回复；无 env Key 依赖 | unit + manual | `tests/unit/iter12-platform-deprecation.test.ts` · M-M12-01 | |
| AC-132 | 部署无 `BAILIAN_API_KEY` | 1. `pnpm test` 2. 静态扫描 | 通过；chat resolve 不读 env | unit + static | `tests/unit/iter12-platform-deprecation.test.ts` AC-132 | |
| AC-136 | 列表中选系统助理 | 1. New chat 2. 发消息 | 对话创建 + 流式开始 | e2e + manual | `tests/e2e/iter12-console-chat.spec.ts` AC-136 · M-M12-02 | |
| AC-48 | 用户 BYOK Untested/Failed | 1. 选未测模型发消息 | 服务端拒绝（ModelNotReady） | unit | `tests/unit/model-config.test.ts`（passed 过滤回归） | |

---

## 6. 门禁与阶段状态

| 阶段 | 状态 | 日期 |
|------|------|------|
| PRD 交叉修订 | 已落盘 | 2026-07-12 |
| 技术设计 | 已修订 [design/chat-model-config-cn.md](../design/chat-model-config-cn.md) §10 | 2026-07-12 |
| 编码 | Phase B 交付完成 | 2026-07-12 |
| 测试 | Matrix 已落盘；C4 随 admin 主 changelog 验收完成 | 2026-07-13 |
| 发布 | **已发布**（用户：`测试已通过，可发布` · 2026-07-13） | 2026-07-13 |

---

## 7. 交叉手工修复（iter-12 · 2026-07-13）

| ID | 关联 | 现象 | 修复 |
|----|------|------|------|
| H-03 | AC-131 | Disable 首条平台模型后页头 `No model configured` | `resolveUserModelForChat` 回退 + `ensureUserProfileDefaults` |
| H-06 | AC-131 | 被 Disable 用户仍可发消息 | middleware + `lib/auth/session` 封禁拦截 |
| H-08 | AC-136 | 平台助理建会话 400 | `create_conversation` RPC 允许平台助理 |

---

## 12. 手工 QA 脚本（qa-engineer · Phase C0 填写，C3 执行）

| # | 映射 AC | 场景 | 前提 | 步骤 | 期望 | 结果 | 证据 |
|---|---------|------|------|------|------|------|------|
| M-M12-01 | AC-131 | 平台模型 Chat | Admin 配 Passed 平台模型；Profile 已选 | 1. `/chat` 发消息 2. Disable 首条模型后再发 | 正常流式；失效偏好回退第二条 | pass | H-03 · 2026-07-13 |
| M-M12-02 | AC-136 | 系统助理 Chat | Admin 配 Enabled 平台助理 | 1. 列表选系统助理 2. 发消息 | 使用平台助理 prompt + Profile 模型 | pass | H-08 · E2E |

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-13 | §7 交叉手工修复；§12 手工结果 |
| 2026-07-13 | 用户确认发布 |
| 2026-07-12 | 创建 mvp-chat iter-12 交叉 changelog |
