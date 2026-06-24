# iter-05 变更摘要 — Chat 模型集成

> **English:** [iter-05.md](./iter-05.md)  
> **中文：** [iter-05-cn.md](./iter-05-cn.md)  
> **迭代索引：** [iter-05/README-cn.md](../../iterations/iter-05/README-cn.md)

---

## 1. 主题

| 主题 | PRD | 设计 |
|------|-----|------|
| Chat modelLabel + `/api/chat` 路由 | [prd/chat-model-config-cn.md](../prd/chat-model-config-cn.md) | [design/chat-model-config-cn.md](../design/chat-model-config-cn.md) |

依赖 [console/prd/models-cn.md](../../console/prd/models-cn.md) 与 [console/prd/profile-cn.md](../../console/prd/profile-cn.md)。

---

## 2. 必读

1. [prd/chat-model-config-cn.md](../prd/chat-model-config-cn.md)
2. [console/changelog/iter-05-cn.md](../../console/changelog/iter-05-cn.md)

---

## 3. 计划变更（实现阶段填充）

| 区域 | 变更 |
|------|------|
| `app/api/chat/route.ts` | 按 Profile 用户模型配置解析 provider + model + Key |
| `app/chat/layout.tsx` | 注入完整 preferred 配置（非仅 model id 字符串） |
| `lib/services/browser/conversation-session.ts` | `modelLabel` 来自用户配置 |
| `lib/services/browser/model-label.ts` | 移除 `NEXT_PUBLIC_LLM_PROVIDER` 依赖 |
| `lib/llm/provider.ts` | 支持 per-request 用户 Key + provider |

---

## 4. 验收清单

- [x] **AC-46** — modelLabel 格式 `{Provider} — {modelName}`，与 Profile 一致
- [x] **AC-47** — 用户配置 Key / 平台 `BAILIAN_API_KEY`
- [x] **AC-48** — 服务端拒绝 Untested/Failed 配置

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-17 | 创建 iter-05 mvp-chat changelog |
| 2026-06-24 | QA 通过；AC-46–48 勾选 |
