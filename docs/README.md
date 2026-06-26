# docs/ — Documentation

Project docs live under `docs/`. **Same as `docs/research/`: English + Chinese pairs.**

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
```

### When to create what

| Situation | Action |
|-----------|--------|
| New product capability (e.g. RAG) | New **feature slug** |
| Large area within one feature | **`prd/` + `design/` topic files** |
| Single iteration changes | **`changelog/iter-NN`** + update topic files |
| Global rule change | Update **`01` / `02` index** (target ≤150 lines) or **[loading-ux.md](./loading-ux.md)** (async loading UX) or **[superpowers-subagent-integration.md](./superpowers-subagent-integration.md)** (Superpowers + subagent workflow) |

### Agent reading order

1. `features/<slug>/README.md` or `iterations/iter-NN/README.md`
2. `changelog/iter-NN.md` required-reading list
3. Do **not** load all topic docs by default

See [README-cn.md](./README-cn.md) for the Chinese version.

## Global docs (repo-wide)

| Topic | English | 中文 |
|-------|---------|------|
| Async loading UX | [loading-ux.md](./loading-ux.md) | [loading-ux-cn.md](./loading-ux-cn.md) |
| Superpowers + subagent workflow | [superpowers-subagent-integration.md](./superpowers-subagent-integration.md) | [superpowers-subagent-integration-cn.md](./superpowers-subagent-integration-cn.md) |

**Example:** [features/mvp-chat/README.md](./features/mvp-chat/README.md) · [changelog/iter-02.md](./features/mvp-chat/changelog/iter-02.md)
