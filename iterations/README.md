# 需求迭代文档快照

与 `docs/` **同级**，按**需求版本号** `{version}`（格式 `MAJOR.MINOR.PATCH`，如 `0.0.1`）存放每一轮「需求 → 设计 → 服务端 → 前端」全流程的**文档**快照。

## 目录结构（每个版本）

```
iterations/{version}/
├── product/    # PRD、用户故事等
├── design/     # 设计说明、流程与交互等
├── backend/    # API 文档、数据模型、服务端自测说明等
└── frontend/   # 前端自测、偏差说明等
```

业务代码仍在项目 `app/`、`src/` 等目录，**不**放入此处。

## 与 `docs/` 的关系

各阶段写入本目录后，须将**相同内容同步**到 `docs/product/`、`docs/design/`、`docs/backend/`、`docs/frontend/`，便于固定路径引用。约定见 [.cursor/agents/WORKFLOW.md](../.cursor/agents/WORKFLOW.md) 与 [.cursor/rules/product-design-dev-workflow.mdc](../.cursor/rules/product-design-dev-workflow.mdc)。
