---
name: iteration-planning
description: >
  7ai-club 迭代与 changelog 规划。新建 iter-NN、主/交叉 feature changelog、
  iter README 时使用。product-analyst 写 PRD 后、fullstack-developer / qa-engineer
  读迭代文档时 Read 本 skill。
---

# 7ai-club 迭代规划

## 何时 Read

- `product-analyst` 写入 PRD / changelog 前
- **新建** `docs/iterations/iter-NN/` 前 — 必读 [`docs/todoList/backlog-cn.md`](../../docs/todoList/backlog-cn.md)，并向用户确认纳入范围的 open 条目
- 新建 `docs/iterations/iter-NN/` 或 `docs/features/*/changelog/iter-NN*`
- 用户问「迭代文档怎么组织」「交叉 feature 怎么写 changelog」

## 单 Feature vs 跨 Feature 迭代

| 类型 | 主 feature | 交叉 feature | 示例 |
|------|------------|--------------|------|
| **单 feature** | 唯一 slug | 无 | iter-10 console 表格优化 |
| **跨 feature** | 新能力或主交付方 | 已有 feature 行为被改 | iter-12 `admin` 主 + `console` / `mvp-chat` 交叉 |

## 跨 Feature 迭代（强制）

### 角色

| 角色 | changelog 路径 | 内容 |
|------|----------------|------|
| **主 feature** | `docs/features/<primary>/changelog/iter-NN*` | 完整 AC、§5.1、§12、计划交付 |
| **交叉 feature** | `docs/features/<affected>/changelog/iter-NN*` | 标题含「交叉修订」；链到主 changelog；本 feature 回归 AC 子集 |

主 changelog §2 **必读**须列出所有交叉 changelog。  
`docs/iterations/iter-NN/README*` 须含「交叉 Changelog」表。

### 交叉 feature 还须同步

1. `01-product-requirements*` — § 全局约定（标 iter-NN superseded / 增量）
2. 受影响 `prd/*` — § iter-NN 增量或 superseded 注记
3. `README*` — 文档地图加入 `changelog/iter-NN`
4. 中英文成对

### 双语对等（强制）

与 `docs/README-cn.md` · `.cursor/rules/7ai-club-workflow.mdc` 一致：

| 规则 | 说明 |
|------|------|
| 结构对等 | `prd/`、`design/`、`changelog/` 英文与中文章节、AC、表结构一致 |
| 链接映射 | 英文 `*.md` 内链英文；中文 `*-cn.md` 内链 `-cn.md` |
| 禁止 stub | 不得 `See *-cn.md for full spec` 替代英文 design/prd 正文 |
| §12 | `02-technical-design.md` 与 `-cn.md` 均须完整 AC 映射 |

写入后自检：同一 topic 的 `.md` 与 `-cn.md` 行数应同量级（±20%）；若 EN ≪ CN，视为未完成。

### 识别交叉影响（检查清单）

写入 PRD 前扫描是否改动：

- 已有路由 / 页面行为（`/console/*`、`/chat/*`）
- 废弃 env 变量或虚拟数据行
- 移除 RPC / seed / 自动复制逻辑
- Profile / Chat / 选择器集成
- 其他 feature 的 PRD 中写明的约定

若有任一项 → 列出受影响 slugs，执行交叉同步（见 `product-analyst` Step 5.1）。

## 模板

| 用途 | 路径 |
|------|------|
| 主 changelog | `.cursor/skills/iteration-planning/templates/changelog-iter-template-cn.md` |
| 交叉 changelog | `.cursor/skills/iteration-planning/templates/changelog-cross-iter-template-cn.md` |
| 迭代 README | `.cursor/skills/iteration-planning/templates/iter-readme-template.md` |

**双语：** 主/交叉 changelog 须同时维护 `iter-NN.md` 与 `iter-NN-cn.md`（结构对等，链接各用本语言路径）。

## Agent 读文档顺序（跨 feature 时）

1. `docs/iterations/iter-NN/README*`
2. **主** `docs/features/<primary>/changelog/iter-NN*`
3. **各交叉** `docs/features/<affected>/changelog/iter-NN*`（按 iter README 表）
4. 各 changelog §2 列出的 `prd/`、`design/` 子文档

## 先例

- iter-07：`agent-orchestration`（主）+ `console`（交叉）
- iter-12：`admin`（主）+ `console` + `mvp-chat`（交叉）
