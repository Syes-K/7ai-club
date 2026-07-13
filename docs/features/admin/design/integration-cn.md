# Console / Chat 集成 — 技术设计（iter-12 交叉）

> **English:** [integration.md](./integration.md)  
> **中文:** [integration-cn.md](./integration-cn.md)  
> **总纲:** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **迭代:** iter-12

---

## 1. 范围

本文件描述 **admin iter-12** 对 `console` 与 `mvp-chat` 的代码改造要点（非 admin 路由本身）。

---

## 2. Console Models（C-12-01 – C-12-03）

| 文件 | 变更 |
|------|------|
| `lib/console/model-configs.ts` | `listModelConfigsForUser` 合并 `listPlatformModelConfigsForUser`；平台行 `readOnly: true` |
| `components/console/models-manager.tsx` | 隐藏平台行 Edit/Delete/Test/Update key |
| `components/console/preferences-card.tsx` | 下拉含平台 UUID；移除哨兵 ID 特殊分支 |
| `lib/services/browser/profile.ts` | `allowedIds` 含平台 passed |

---

## 3. Chat 模型（mvp-chat）

| 文件 | 变更 |
|------|------|
| `lib/llm/resolve-user-model.ts` | 平台表解析 + decrypt |
| `lib/llm/provider.ts` | 删除 `buildPlatformDefaultResolved` env 分支 |
| `app/chat/layout.tsx` | label 来自合并配置 |
| `lib/workflow/nodes/resolve-model.ts` | 无接口变更，走新 resolve |
| `lib/memory/resolve-summary-model.ts` | 回退链含平台模型 |

---

## 4. New Chat 选择器

| 文件 | 变更 |
|------|------|
| `lib/services/browser/assistants.ts` | `listAssistantOptions` 聚合 |
| `components/chat/assistant-picker-dialog.tsx` | Platform badge、排序 |
| `app/api/conversations/route.ts` | 校验平台 `assistantId` |

---

## 5. 废弃清单

| 项 | 操作 |
|----|------|
| `PLATFORM_DEFAULT_CONFIG_ID` | 移除 UI 依赖；测试更新 |
| `BAILIAN_API_KEY` | 删除读取；`.env.example` 移除 |
| `mergePlatformDefault` | 删除 |
| `ensure_user_assistants` INSERT | SQL 替换为 SELECT-only |
| `getPlatformTemplateModel` 用于 seed | 删除或仅 admin 迁移用 |

---

## 6. 交叉 changelog §12（回归 AC）

| AC | Console / Chat 验证 |
|----|---------------------|
| AC-129 | Profile e2e |
| AC-130 | `/console/models` e2e |
| AC-133 | BYOK CRUD e2e |
| AC-131–132 | `tests/unit/resolve-user-model*.ts` |
| AC-135–138 | `assistant-picker` e2e |
| AC-136 | 系统助理对话 e2e |
| AC-139 | workflow unit |

---

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-12 | iter-12 交叉集成初稿 |
