# console — 功能概览

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Feature slug:** `console`  
> **迭代:** [iter-05](../../iterations/iter-05/README-cn.md)（已交付）· [iter-09](../../iterations/iter-09/README-cn.md)（RAG 增量）· [iter-10](../../iterations/iter-10/README-cn.md)（**已发布**）· [iter-12](../../iterations/iter-12/README-cn.md)（admin 交叉修订）

---

## 文档地图（Agent 入口）

**iter-12（admin 交叉修订 · 进行中）：**

1. [changelog/iter-12-cn.md](./changelog/iter-12-cn.md) — Console 侧 AC 回归索引
2. [admin/changelog/iter-12-cn.md](../admin/changelog/iter-12-cn.md) — **主验收 AC-120–141**
3. [iter-12/README-cn.md](../../iterations/iter-12/README-cn.md)

**iter-10 已发布：**

1. [changelog/iter-10-cn.md](./changelog/iter-10-cn.md) — **AC-110**
2. [iter-10/README-cn.md](../../iterations/iter-10/README-cn.md)

**历史迭代：**

1. [changelog/iter-05-cn.md](./changelog/iter-05-cn.md) — **iter-05 AC-40–48**  
2. [changelog/iter-03-cn.md](./changelog/iter-03-cn.md) · [iter-04 mvp-chat](../mvp-chat/changelog/iter-04-cn.md)

---

## iter-05 范围摘要

- **Models** — BYOK、加密 Key、独立 Update key、测试状态、平台默认 Bailian  
- **Profile** — Account / Preferences 双 Card、Detail/Edit、独立 Save  
- **Chat 集成** — 见 [mvp-chat/prd/chat-model-config-cn.md](../mvp-chat/prd/chat-model-config-cn.md)

## iter-10 增量（已发布 · 2026-07-03）

- Models / Knowledge Base / Assistants 表格 **Actions 列 sticky**
- Preferences **Query optimization** 复选框（见 [knowledge-base/changelog/iter-10-cn.md](../knowledge-base/changelog/iter-10-cn.md)）
- Assistants `?create=1` deep link

## iter-12 增量（admin 交叉修订 · 进行中）

- **Models** — 平台免费模型改由 `/admin/models` 管理；Console 只读 **Platform** 行；废弃 `BAILIAN_API_KEY`
- **Assistants** — 移除自动 seed；Console 仅个人助理
- **New Chat** — 单列表聚合个人 + 系统助理（系统排后）
- Console PRD 已同步：[`01-product-requirements-cn.md`](./01-product-requirements-cn.md) · [`prd/models-cn.md`](./prd/models-cn.md) · [`prd/assistants-cn.md`](./prd/assistants-cn.md) · [`prd/chat-assistant-picker-cn.md`](./prd/chat-assistant-picker-cn.md)
- Changelog：[changelog/iter-12-cn.md](./changelog/iter-12-cn.md)
- 详见 [admin/changelog/iter-12-cn.md](../admin/changelog/iter-12-cn.md)

---

*分层说明:* [docs/README-cn.md](../../README-cn.md)
