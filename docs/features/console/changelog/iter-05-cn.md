# iter-05 变更摘要 — 用户模型配置

> **English:** [iter-05.md](./iter-05.md)  
> **中文：** [iter-05-cn.md](./iter-05-cn.md)  
> **迭代索引：** [iter-05/README-cn.md](../../iterations/iter-05/README-cn.md)

---

## 1. 主题

| 主题 | PRD | 设计 |
|------|-----|------|
| Models 管理（BYOK + 测试） | [prd/models-cn.md](../prd/models-cn.md) | [design/models-cn.md](../design/models-cn.md) |
| Profile 双 Card + Preferences | [prd/profile-cn.md](../prd/profile-cn.md) | [design/profile-cn.md](../design/profile-cn.md) |

影响 **console**；Chat 展示见 [mvp-chat changelog iter-05](../../mvp-chat/changelog/iter-05-cn.md)。

---

## 2. 必读

1. [prd/models-cn.md](../prd/models-cn.md)
2. [prd/profile-cn.md](../prd/profile-cn.md)
3. [mvp-chat/prd/chat-model-config-cn.md](../../mvp-chat/prd/chat-model-config-cn.md)

---

## 3. 计划代码变更（实现阶段填充）

### 3.1 新增（预期）

```
app/console/models/          # 替换占位页
app/api/models/test/         # 模型测试（Node）
components/console/models-*  # 列表、表单、Update key 弹窗
components/console/profile-* # 双 Card Detail/Edit
supabase/migrations/         # user_model_configs 等（技术设计定）
lib/llm/                     # 按用户配置解析 provider + key
tests/unit/ iter-05-*.test.ts
tests/e2e/iter05-*.spec.ts
```

### 3.2 修改（预期）

```
app/console/profile/page.tsx
components/console/profile-form.tsx → 拆分为 Account + Preferences cards
app/api/chat/route.ts
app/chat/layout.tsx
lib/services/browser/profile.ts
lib/services/browser/model-label.ts
lib/constants/model-options.ts   # 移除 env 静态列表依赖
lib/validation/profile.ts
```

### 3.3 删除 / 废弃

```
components/console/placeholder-page.tsx  # Models 路由不再使用（KB/MCP 仍用）
env NEXT_PUBLIC_LLM_PROVIDER 驱动 UI   # Chat/Profile 改读用户配置
```

### 3.3 跨模块（iter-05）

- **全局 Loading UX** — [loading-ux-cn.md](../../loading-ux-cn.md)（决策树、Console + Chat + Auth）。
- **Console busy loading** — Models / Assistants 页面级（`ConsolePage` + `usePageBusy`）；Profile 区块级（`ConsoleSection`）。Console 索引：[design/console-shell-cn.md](../design/console-shell-cn.md) §8。

```
components/console/console-page.tsx
components/console/console-section.tsx
components/console/console-busy-overlay.tsx
components/console/console-page-loading.tsx
components/console/use-page-busy.ts
app/console/models/loading.tsx
app/console/profile/loading.tsx
```

---

## 4. 验收清单

- [x] **AC-40** — Models CRUD；Network 无 Key
- [x] **AC-41** — Update API key 独立流程
- [x] **AC-42** — Test Passed/Failed 持久化；仅 Passed 可选
- [x] **AC-43** — Profile Preferences 下拉仅 Passed
- [x] **AC-44** — Account / Preferences 独立 Save
- [x] **AC-45** — Profile 默认 Detail + Edit 模式
- [x] **AC-46** — Chat modelLabel 与 Preferences 一致
- [x] **AC-47** — Chat 用户 Key / 平台 env Key
- [x] **AC-48** — Untested/Failed 不可消费

---

## 5. 手工 QA

| # | 场景 | E2E | 手测 |
|---|------|-----|------|
| 1 | 新用户可见 Platform default Passed | — | [x] |
| 2 | Add model → Test Passed → Profile 可选 | AC-42/43 | [x] |
| 3 | Test Failed → Profile 不可选、Chat 不可用 | AC-48 | [x] |
| 4 | Update key 后 Untested，重测 Passed | AC-41/48 | [x] |
| 5 | Account Save 不改 Preferences | AC-44 | [x] |
| 6 | Preferences Save 不改 nickName | AC-44 | [x] |
| 7 | Chat 发消息使用所选模型 Key | AC-47 | [x] |
| 8 | 删除当前 preference 配置 — 阻止 | models §3.9 | [x] |

---

## 6. 自动化测试（实现后由 qa-engineer 填充）

| AC | 测试文件 |
|----|----------|
| AC-40–42 | `tests/unit/model-config.test.ts`、`tests/e2e/iter05-console-models.spec.ts` |
| AC-43–45 | `tests/unit/profile-validation.test.ts`、`tests/e2e/iter05-console-profile.spec.ts` |
| AC-46 | `tests/e2e/iter05-chat-model.spec.ts` |
| AC-47–48 | 手工 QA（LLM / provider） |

```bash
pnpm lint && pnpm build && pnpm test
pnpm test:e2e --workers=1
pnpm test:ci
```

---

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-17 | 创建 iter-05 changelog — PRD 已确认 |
| 2026-06-17 | §3.3 Console busy loading 规范 → console-shell §8 |
| 2026-06-17 | 全局 [loading-ux-cn.md](../../loading-ux-cn.md) — loading 审计 + RSC loading.tsx |
| 2026-06-24 | QA 通过；AC-40–48 勾选 |
