# docs/ — 文档

项目文档位于 `docs/`。**与 `docs/research/` 相同：中英文各一份，成对维护。**

## 双语命名（与 research 一致）

| 语言 | 文件名 | 示例 |
|------|--------|------|
| English | `{name}.md` | `01-product-requirements.md` |
| 中文 | `{name}-cn.md` | `01-product-requirements-cn.md` |

每个文件顶部应链接到对应语言版本：

```markdown
> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)
```

更新任一语言时，同步另一份（结构、决策一致；正文翻译）。

## 目录结构

```
docs/
  README.md                 # English
  README-cn.md              # 本说明（中文）

  research/                 # 架构调研（只读参考）
    topic.md                # English
    topic-cn.md             # 中文

  features/<slug>/          # 功能 PRD + 技术设计（跨迭代修订）
    README.md               # 可选：功能概览（English）
    README-cn.md            # 可选：功能概览（中文）
    01-product-requirements.md
    01-product-requirements-cn.md
    02-technical-design.md
    02-technical-design-cn.md

  iterations/<iter-id>/     # 迭代索引（不重复 PRD 正文）
    README.md
    README-cn.md
```

## 不需要双语的范围

| 范围 | 语言 | 说明 |
|------|------|------|
| 用户可见 UI | English | 见 architecture `reference.md` → Locale |
| DB seed / 默认值 | English | migration、system_prompt 等 |
| Cursor rules / skills | 中文为主 | Agent 指令；术语可保留英文 |
| 代码注释 | 优先 English | 与代码库一致 |

## Research 范例

- [`research/ai-agent-platform-architecture.md`](./research/ai-agent-platform-architecture.md)
- [`research/ai-agent-platform-architecture-cn.md`](./research/ai-agent-platform-architecture-cn.md)

架构摘要：`.cursor/skills/7ai-club-architecture/reference.md`（research 变更时同步）。

## 遗留说明

早期 feature 文档可能仅有一种语言。**mvp-chat** 与 **iter-01** 已按 `{name}.md` + `{name}-cn.md` 成对维护。

**iter-01 本地迭代** 已完成，索引见 [`iterations/iter-01/README-cn.md`](./iterations/iter-01/README-cn.md)；功能交付概览见 [`features/mvp-chat/README-cn.md`](./features/mvp-chat/README-cn.md)。
