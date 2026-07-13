# docs/ — 文档

项目文档位于 `docs/`。**与 `docs/research/` 相同：中英文各一份，成对维护。**

## 双语命名

| 语言 | 文件名 |
|------|--------|
| English | `{name}.md` |
| 中文 | `{name}-cn.md` |

### 双语对等规则（强制）

与 [`.cursor/rules/7ai-club-workflow.mdc`](../.cursor/rules/7ai-club-workflow.mdc) 一致：**结构对等 + 链接同语言**。

- `prd/`、`design/`、`changelog/`：**禁止**英文正文仅 `See *-cn.md`
- 英文文档链英文路径；中文文档链 `*-cn.md`
- `02-technical-design.md` 须含完整 §12 AC 映射（不可只链到 `-cn.md`）

## 三层文档模型（Feature 为主 + 子文档 + 迭代索引）

**PRD / 技术设计** 放在 feature 目录，采用 **总纲 + 子文档** 分层：

避免单个 PRD / 技术设计随迭代无限膨胀。**总纲薄、细节分册、迭代只写增量。**

```
docs/
  features/<slug>/
    README-cn.md                 # 功能概览 + 文档地图（Agent 入口）
    01-product-requirements-cn.md  # 产品总纲：全局约定、索引、Out of Scope
    02-technical-design-cn.md      # 技术总纲：架构、跨模块约定、索引

    prd/                           # 产品子文档（按子能力拆分）
      core-chat-cn.md
      landing-cn.md
      ...

    design/                        # 技术子文档（按模块拆分）
      core-chat-cn.md
      landing-cn.md
      ...

    changelog/                     # 迭代增量（验收清单、必读文档列表）
      iter-02-cn.md                # §5 AC · §5.1 Test Matrix · §12 Manual Script（qa C0→C4）

  iterations/<iter-id>/            # 时间盒：目标、范围、待办（不重复 PRD 正文）
    README-cn.md
```

### 何时新建什么

| 情况 | 做法 |
|------|------|
| 新的独立产品能力（如 RAG、助理 CRUD） | 新 **feature slug** + 新目录 |
| 同一 feature 内的大块（首页 vs Chat vs LLM） | 同 slug 下 **`prd/`、`design/` 子文档** |
| 单次迭代改动 | **`changelog/iter-NN`** + 更新相关子文档 |
| 迭代影响多个 feature | **主** feature `changelog/iter-NN`（完整 AC）+ **各交叉** feature `changelog/iter-NN`（交叉修订模板）；见 [iteration-planning/SKILL.md](../.cursor/skills/iteration-planning/SKILL.md) |
| 全局规则变更 | 更新 **`01` / `02` 总纲**（保持 ≤150 行目标）或 **[loading-ux-cn.md](./loading-ux-cn.md)**（异步 loading）或 **[superpowers-subagent-integration-cn.md](./superpowers-subagent-integration-cn.md)**（Superpowers + subagent 工作流） |
| 推迟 / 砍掉的能力 | 记入 **[todoList/backlog-cn.md](./todoList/backlog-cn.md)** |

### Agent 读文档约定

1. 先读 `features/<slug>/README-cn.md` 或当前 `iterations/iter-NN/README-cn.md`
2. 再读 **主** `changelog/iter-NN-cn.md` 中的 **必读列表**
3. **跨 feature 迭代：** 读 iter README「交叉 Changelog」表，加载各交叉 feature 的 `changelog/iter-NN*`
4. **不要**默认加载全部 `prd/`、`design/`（省 token）

迭代规划（主/交叉 changelog）：`.cursor/skills/iteration-planning/SKILL.md`

## 目录结构（完整）

```
docs/
  README.md / README-cn.md
  loading-ux.md / loading-ux-cn.md   # 全局：异步 loading UX
  superpowers-subagent-integration.md / superpowers-subagent-integration-cn.md  # Agent 工作流：Superpowers + subagent
  research/
  features/<slug>/          # 见上
  iterations/<iter-id>/
  todoList/                      # 跨迭代待办 backlog（新 iter 前须用户确认是否纳入）
    README-cn.md
    backlog-cn.md
```

## 全局文档（跨 feature）

| 主题 | English | 中文 |
|------|---------|------|
| 异步 loading UX | [loading-ux.md](./loading-ux.md) | [loading-ux-cn.md](./loading-ux-cn.md) |
| Superpowers + subagent 工作流 | [superpowers-subagent-integration.md](./superpowers-subagent-integration.md) | [superpowers-subagent-integration-cn.md](./superpowers-subagent-integration-cn.md) |
| 跨迭代待办 backlog | [todoList/README.md](./todoList/README.md) | [todoList/README-cn.md](./todoList/README-cn.md) |

## 不需要双语的范围

| 范围 | 语言 |
|------|------|
| 用户可见 UI | English |
| DB seed / 默认值 | English |
| Cursor rules / skills | 中文为主 |

## 范例

- Feature 分层范例：**mvp-chat** — [`features/mvp-chat/README-cn.md`](./features/mvp-chat/README-cn.md)
- iter-02 增量 — [`features/mvp-chat/changelog/iter-02-cn.md`](./features/mvp-chat/changelog/iter-02-cn.md)

**iter-01** 已完成 · **iter-02** 进行中 — 见 [`iterations/iter-02/README-cn.md`](./iterations/iter-02/README-cn.md)
