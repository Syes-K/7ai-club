# docs/ — Documentation

Project docs live under `docs/`. **Same as `docs/research/`: English + Chinese pairs.**

## Bilingual parity (required)

Same rules as [`.cursor/rules/7ai-club-workflow.mdc`](../.cursor/rules/7ai-club-workflow.mdc):

- **Structural parity** for `prd/`, `design/`, `changelog/` — not English stubs pointing at `-cn.md`
- **Link mapping:** English `*.md` → English paths; Chinese `*-cn.md` → `-cn.md` paths
- **`02-technical-design.md`** must include full §12 AC mapping in English

## Three-layer model (feature index + topic docs + iteration changelog)

Avoid unbounded growth of monolithic PRD / technical design files.

```
docs/features/<slug>/
  README.md                      # Overview + doc map (agent entry)
  01-product-requirements.md     # Thin index: globals, out of scope, links
  02-technical-design.md         # Thin index: architecture, cross-module rules

  prd/                           # Product topic docs
  design/                        # Technical topic docs
  changelog/                     # Per-iteration delta (required reading list)
    iter-02.md                   # §5 AC · §5.1 Test Matrix · §12 Manual Script (qa C0→C4)

docs/iterations/<iter-id>/       # Timebox goals & todos (no full PRD copy)
docs/todoList/                   # Cross-iter backlog (confirm with user before new iter)
```

### When to create what

| Situation | Action |
|-----------|--------|
| New product capability (e.g. RAG) | New **feature slug** |
| Large area within one feature | **`prd/` + `design/` topic files** |
| Single iteration changes | **`changelog/iter-NN`** + update topic files |
| Iteration spans multiple features | **Primary** `changelog/iter-NN` (full AC) + **cross** changelogs per affected feature; see [iteration-planning/SKILL.md](../.cursor/skills/iteration-planning/SKILL.md) |
| Global rule change | Update **`01` / `02` index** (target ≤150 lines) or **[loading-ux.md](./loading-ux.md)** (async loading UX) or **[superpowers-subagent-integration.md](./superpowers-subagent-integration.md)** (Superpowers + subagent workflow) |
| Deferred / cut scope | Add to **[todoList/backlog.md](./todoList/backlog.md)** |

### Agent reading order

1. `features/<slug>/README.md` or `iterations/iter-NN/README.md`
2. **Primary** `changelog/iter-NN.md` required-reading list
3. **Cross-feature iteration:** read iter README cross-changelog table; load each affected `changelog/iter-NN*`
4. Do **not** load all topic docs by default

Iteration planning: `.cursor/skills/iteration-planning/SKILL.md`

See [README-cn.md](./README-cn.md) for the Chinese version.

## Global docs (repo-wide)

| Topic | English | 中文 |
|-------|---------|------|
| Async loading UX | [loading-ux.md](./loading-ux.md) | [loading-ux-cn.md](./loading-ux-cn.md) |
| Superpowers + subagent workflow | [superpowers-subagent-integration.md](./superpowers-subagent-integration.md) | [superpowers-subagent-integration-cn.md](./superpowers-subagent-integration-cn.md) |
| Cross-iteration backlog | [todoList/README.md](./todoList/README.md) | [todoList/README-cn.md](./todoList/README-cn.md) |

**Example:** [features/mvp-chat/README.md](./features/mvp-chat/README.md) · [changelog/iter-02.md](./features/mvp-chat/changelog/iter-02.md)
