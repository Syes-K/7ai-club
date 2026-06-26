# iter-07 变更摘要 — Preferences 摘要配置

> **English:** [iter-07.md](./iter-07.md)  
> **中文：** [iter-07-cn.md](./iter-07-cn.md)  
> **迭代索引：** [iter-07/README-cn.md](../../iterations/iter-07/README-cn.md)

---

## 1. 主题

| 主题 | PRD |
|------|-----|
| Preferences · Conversation memory | [prd/profile-cn.md](../prd/profile-cn.md) §3.4 |

**主 PRD：** [agent-orchestration/prd/history-summarization-cn.md](../../agent-orchestration/prd/history-summarization-cn.md)

---

## 2. 变更摘要

- Preferences Card 新增 **Conversation memory** 区块（6 项）  
- 独立 Save；Toggle Off 时数字字段 disabled  
- 校验：`retain ≤ trigger`（turns / tokens）

**编码期：** 远程 DB 需 iter-07 migration；用户自定义 trigger（如 6/2000 · retain 2/500）已支持。

---

## 3. 验收

- [x] **AC-70** — 与 agent-orchestration changelog 一致（2026-06-26）

---

## 4. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-25 | 创建 iter-07 console changelog |
| 2026-06-25 | 编码完成；与 agent-orchestration changelog §6 门禁同步 |
| 2026-06-26 | AC-70 勾选；迭代已发布 |
