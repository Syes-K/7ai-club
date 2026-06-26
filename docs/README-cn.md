# docs/ — 文档

项目文档位于 `docs/`。**与 `docs/research/` 相同：中英文各一份，成对维护。**

## 双语命名

| 语言 | 文件名 |
|------|--------|
| English | `{name}.md` |
| 中文 | `{name}-cn.md` |

## 三层文档模型（Feature 为主 + 子文档 + 迭代索引）

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
| 全局规则变更 | 更新 **`01` / `02` 总纲**（保持 ≤150 行目标）或 **[loading-ux-cn.md](./loading-ux-cn.md)**（异步 loading）或 **[superpowers-subagent-integration-cn.md](./superpowers-subagent-integration-cn.md)**（Superpowers + subagent 工作流） |

### Agent 读文档约定

1. 先读 `features/<slug>/README-cn.md` 或当前 `iterations/iter-NN/README-cn.md`
2. 再读 `changelog/iter-NN-cn.md` 中的 **必读列表**
3. **不要**默认加载全部 `prd/`、`design/`（省 token）

## 目录结构（完整）

```
docs/
  README.md / README-cn.md
  loading-ux.md / loading-ux-cn.md   # 全局：异步 loading UX
  superpowers-subagent-integration.md / superpowers-subagent-integration-cn.md  # Agent 工作流：Superpowers + subagent
  research/
  features/<slug>/          # 见上
  iterations/<iter-id>/
```

## 全局文档（跨 feature）

| 主题 | English | 中文 |
|------|---------|------|
| 异步 loading UX | [loading-ux.md](./loading-ux.md) | [loading-ux-cn.md](./loading-ux-cn.md) |
| Superpowers + subagent 工作流 | [superpowers-subagent-integration.md](./superpowers-subagent-integration.md) | [superpowers-subagent-integration-cn.md](./superpowers-subagent-integration-cn.md) |

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
