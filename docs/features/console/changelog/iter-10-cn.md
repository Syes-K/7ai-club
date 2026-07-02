# iter-10 变更摘要 — console（表格 Actions · 共享组件）

> **English:** [iter-10.md](./iter-10.md)  
> **中文：** [iter-10-cn.md](./iter-10-cn.md)  
> **迭代索引：** [iter-10/README-cn.md](../../iterations/iter-10/README-cn.md)

---

## 1. 主题

| 主题 | 说明 |
|------|------|
| 表格 Actions sticky | Models / Knowledge Base / Assistants 列表 |
| 共享 UI | `console-table-actions.ts` · `console-file-input.tsx` · `field-hint.tsx` |

---

## 2. 必读

1. [changelog/iter-09-cn.md](../knowledge-base/changelog/iter-09-cn.md) — KB 列表 iter-09 基线  
2. [iter-10/README-cn.md](../../iterations/iter-10/README-cn.md)

---

## 3. 实际交付（Phase B）

| ID | 项 | 路径 |
|----|-----|------|
| C-01 | Actions 列 **sticky right** + 不透明背景 | `console-table-actions.ts` |
| C-02 | Actions 按钮紧凑 `h-7 text-xs` + flex-wrap | 同上 |
| C-03 | Updated 列 truncate，防 hover 穿透 | `CONSOLE_TABLE_PRE_ACTIONS_CELL` |
| C-04 | Models / KB / Assistants 三页统一 | `*-manager.tsx` |
| C-05 | FieldHint 复用（Preferences query optimize 等） | `components/ui/field-hint.tsx` |
| C-06 | Assistants `?create=1` | `assistants-manager.tsx` |

---

## 4. 产品决策

| 项 | 决策 |
|----|------|
| Sticky Actions | 宽表横向滚动时 Actions 始终可见 |
| 列宽 | Models 13rem；KB/Assistants 9.5rem（与 iter-09 两行 Actions 兼容） |

---

## 5. 验收清单

- [x] **AC-110** — Console 三列表 Actions 列 sticky，hover 无文字穿透

### 5.1 Test Matrix

| AC ID | 前提 | 操作步骤 | 期望结果 | 验证方式 | 自动化覆盖 | 证据 |
|-------|------|----------|----------|----------|------------|------|
| AC-110 | 列表 ≥1 行；窄视口或宽表 | 1. `/console/models` 2. 横滚 3. hover Actions | Actions 贴右固定；Updated 列 truncate；hover 无左侧长文本叠层 | manual + e2e smoke | `iter10-polish` AC-110 | pass · 2026-07-03 |
| AC-110b | Assistants | 1. `/console/assistants?create=1` | Create dialog 自动打开 | e2e | `iter10-polish` AC-110b | pass · 2026-07-03 |

---

## 12. 手工 QA 脚本

| # | 映射 AC | 场景 | 步骤 | 期望 | 结果 | 证据 |
|---|---------|------|------|------|------|------|
| M-110 | AC-110 | Models sticky | 缩窄窗口横滚 + Edit hover | Actions 固定右侧 | pass | e2e 三页 Actions 列 |

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-07-02 | 创建 iter-10 console changelog |
| 2026-07-03 | QA C4：AC-110 勾选 |
