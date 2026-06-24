---
name: 7ai-club-superpowers-bridge
description: >
  7ai-club 与 Superpowers 整合桥接：阶段白名单、文档路径映射、冲突覆盖规则。
  仅由 product-analyst / fullstack-developer / qa-engineer subagent 启动时 Read。
  冲突时 7ai-club 门禁与 docs/features/ 文档体系优先于 Superpowers 默认流程。
disable-model-invocation: true
---

# 7ai-club × Superpowers 桥接

## 何时 Read

- 你是 `product-analyst`、`fullstack-developer` 或 `qa-engineer` subagent 时，**启动后第一件事 Read 本文件**
- 根 Agent / 主对话 **不得** Read 或遵循 Superpowers skills（均已 `disable-model-invocation: true`）

## 优先级

**7ai-club 规则 > Superpowers 默认流程。** 下表覆盖 Superpowers skill 内的路径与结束态。

## 阶段白名单

| 阶段 | Subagent | 允许 Read 的 Superpowers | 7ai-club 文档落点 |
|------|----------|-------------------------|------------------|
| 需求对焦 | `product-analyst` | `brainstorming` | `docs/features/<slug>/01-product-requirements*.md`、`prd/`、`changelog/iter-NN*` |
| 技术设计 | `fullstack-developer` Phase A | `brainstorming`、`writing-plans` | `02-technical-design*.md`、`design/` |
| 编码 | `fullstack-developer` Phase B | `test-driven-development`、`executing-plans`、`subagent-driven-development`、`using-git-worktrees`、`dispatching-parallel-agents` | 代码 + `changelog/iter-NN*` 执行勾选 |
| 测试验收 | `qa-engineer` | `systematic-debugging`、`requesting-code-review`、`receiving-code-review`、`finishing-a-development-branch` | `changelog/iter-NN-cn.md` AC + 验收报告 |

Superpowers skills 路径：`.agents/skills/<skill-name>/SKILL.md`

## 冲突覆盖规则

### 1. `brainstorming` 结束态

- **Superpowers 默认**：approved → invoke `writing-plans`
- **7ai-club 覆盖（product-analyst）**：approved → 写入 PRD → 等待用户 **「PRD 已确认，可进入技术设计」**
- **禁止**：跳转 `writing-plans` 做编码计划、写入 `docs/superpowers/`

### 2. `writing-plans` 输出路径

- **Superpowers 默认**：`docs/superpowers/plans/`
- **7ai-club 覆盖**：
  - Phase A（技术设计）：写入 `docs/features/<slug>/design/` 或 `02-technical-design*.md` 的「实施任务清单」
  - Phase B（编码）：可在 `changelog/iter-NN-cn.md` 增加 checkbox 任务清单
- **禁止**：使用 `docs/superpowers/` 作为计划落点

### 3. `test-driven-development` vs qa-engineer

- TDD 仅用于 **fullstack-developer Phase B** 增量开发
- **changelog AC 勾选**与迭代 **「已发布」** 状态 **仅 qa-engineer** 可更新

### 4. Code review skills

- `requesting-code-review` / `receiving-code-review` 是 QA 阶段手法，**不替代** `qa-engineer` 的 AC 验收
- Superpowers 自带 code-reviewer subagent **不替代** `qa-engineer`

## 用户确认话术 ↔ 阶段

| 话术 | 允许进入 |
|------|---------|
| `PRD 已确认，可进入技术设计` | fullstack-developer Phase A |
| `技术设计已确认，可开始编码` | fullstack-developer Phase B + TDD / executing-plans |
| `测试已通过，可发布` | qa-engineer 标迭代已发布 |

无对应话术 → **停止**，提示用户完成上一阶段或调用正确 subagent。

### 门禁状态 ↔ 下一步提示（各 subagent 向用户说明时必须一致）

完整表见 `.cursor/rules/7ai-club-workflow.mdc` §门禁状态。**核心规则：**

| 当前状态 | 应提示的下一步 | 应请用户回复的话术 |
|----------|----------------|-------------------|
| PRD 已确认 | 技术设计（Phase A） | `PRD 已确认，可进入技术设计` 或 dispatch fullstack-developer 做技术设计 |
| 技术设计已确认 | 编码（Phase B） | `技术设计已确认，可开始编码` |
| 编码完成 | qa-engineer 测试 | `用 qa-engineer 对 iter-NN 执行测试验收` |
| 测试已通过 | 发布 | `测试已通过，可发布` |

**禁止混用：** PRD 已确认后 **不得** 提示 `技术设计已确认，可开始编码`（那是下一阶段话术）。

## 与现有 7ai-club skills 叠加

| 用途 | 优先 skill |
|------|-----------|
| 架构 / 范围 | `.cursor/skills/7ai-club-architecture/reference.md` |
| PRD 模板 | `.cursor/skills/product-requirements/templates/` |
| 技术设计模板 | `.cursor/skills/technical-design/templates/` |
| UI 实现 | `.agents/skills/ui-ux-pro-max/SKILL.md`（Phase B） |
| 测试约定 | `.cursor/skills/7ai-club-testing/SKILL.md`（qa-engineer） |
| React 性能 | `.agents/skills/vercel-react-best-practices/SKILL.md`（Phase B，按需） |
| Supabase | `.agents/skills/supabase/SKILL.md`（Phase A/B，按需） |

## 安装与更新

```bash
pnpm skills:install   # 从 skills-lock.json 恢复 + 自动 patch 门禁
pnpm skills:update    # 更新项目 skills + 自动 patch 门禁
pnpm skills:lock      # 从 .agents/skills/ 重新生成 skills-lock.json
```

Superpowers 来源：`git@github.com:obra/superpowers.git`（见根目录 `skills-lock.json`）。
