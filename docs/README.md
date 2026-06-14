# docs/ — Documentation

Project documentation lives under `docs/`. **Follow the same bilingual pattern as `docs/research/`:** maintain **English and Chinese** as paired files.

## Bilingual naming (same as research)

| Language | Filename pattern | Example |
|----------|------------------|---------|
| English | `{name}.md` | `01-product-requirements.md` |
| 中文 | `{name}-cn.md` | `01-product-requirements-cn.md` |

Each file should link to its counterpart at the top:

```markdown
> **English:** [01-product-requirements.md](./01-product-requirements.md)  
> **中文：** [01-product-requirements-cn.md](./01-product-requirements-cn.md)
```

When one language is updated, sync the other (same structure and decisions; translate prose).

## Directory layout

```
docs/
  README.md                 # This file (English)
  README-cn.md              # 本说明（中文）

  research/                 # Architecture research (read-only reference)
    topic.md                # English
    topic-cn.md             # 中文

  features/<slug>/          # Living PRD + technical design per feature
    01-product-requirements.md
    01-product-requirements-cn.md
    02-technical-design.md
    02-technical-design-cn.md

  iterations/<iter-id>/     # Time-box index only (no duplicate PRD bodies)
    README.md
    README-cn.md
```

## What is *not* bilingual

| Scope | Language | Notes |
|-------|----------|--------|
| User-facing app UI | English | See architecture `reference.md` → Locale |
| DB seed / defaults | English | migrations, `assistants.system_prompt`, etc. |
| Cursor rules / skills | 中文为主 | Agent instructions; may cite English terms |
| Code comments | English preferred | Match codebase |

## Research reference

The research pair is the canonical example:

- [`research/ai-agent-platform-architecture.md`](./research/ai-agent-platform-architecture.md)
- [`research/ai-agent-platform-architecture-cn.md`](./research/ai-agent-platform-architecture-cn.md)

Architecture summaries: `.cursor/skills/7ai-club-architecture/reference.md` (sync when research changes).

## Legacy note

Early feature docs may have existed in a single language. **mvp-chat** and **iter-01** now follow the paired `{name}.md` + `{name}-cn.md` convention.
