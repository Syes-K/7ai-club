# Implementation Notes: Intent Config Page (v0.1.1)

## 页面结构

- 新增页面路由：`/console/intent-routing/config`。
- 页面分为三块：
  - 全局参数只读区（显示 `confidenceThreshold`、`topN`、`scoreThreshold`、版本等）；
  - 意图路由编辑区（`intentId`、`enabled`、`keywords`、`nextNodes`、`updatedBy`）；
  - 每个意图行内配置 `knowledge_search.input.selectedKnowledgeBaseEntryIdsByIntent[intentId]` + 底部操作区（校验、保存、执行一次）。
- 在控制台侧边导航新增“意图配置”入口，保持与现有 `/console` 导航风格一致。

## 关键状态

- 加载态：请求配置时显示 `Spin`。
- 错误态：加载失败时显示 `Alert + 重试`。
- 空态：配置缺失时显示 `Empty`。
- 编辑态：任意字段变更即标记 `isDirty=true`，展示“有未保存更改”状态。
- 离开保护：`beforeunload` 阻止浏览器刷新/关闭时丢失未保存内容。

## API 映射

- 读取配置：`GET /api/console/intent-routing/config`
  - 初始化页面配置与 warning。
- 校验配置：`POST /api/console/intent-routing/config:validate`
  - 保存前强制先校验。
- 保存配置：`PUT /api/console/intent-routing/config`
  - 成功后更新版本与更新时间。
- 执行一次（调试）：`POST /api/console/intent-routing/execute-once`
  - 发送 `intentId + query + 当前草稿 config`，展示 `intentHit/fallbackReason/traces/finalAnswer`。

## 校验行为

- 前端本地校验：
  - 某意图路由 `nextNodes` 包含 `knowledge_search` 时，该意图对应的 `selectedKnowledgeBaseEntryIdsByIntent[intentId]` 必填（至少 1 项）。
  - 若不满足，阻止进入后端校验与保存，并显示错误摘要。
- 后端字段错误回填：
  - 读取 `fieldErrors`，在页面全局错误摘要中展示。

## 已知限制

1. 知识库条目选项当前通过“先拉 knowledge base，再逐个拉 entries”拼装，知识库规模很大时会增加初始化请求数。
2. 页面内“未保存离开提示”目前覆盖浏览器离开/刷新场景；站内路由跳转仍依赖用户操作时的显式保存习惯。
3. `execute-once` 结果当前以弹窗显示基础信息，未做完整 trace 可视化图形展示。

## 测试建议

1. 打开 `/console/intent-routing/config`，验证加载成功、导航高亮、全局参数只读展示。
2. 将某路由 `nextNodes` 选中 `knowledge_search`，清空知识库条目后点击保存，应被前端阻止并显示字段错误。
3. 补齐知识库条目后点击“校验配置”，应通过；再点击“保存配置”应返回成功并更新版本标识。
4. 使用“执行一次”输入测试 query，确认可返回 `intentHit/fallbackReason/traces/finalAnswer`。
5. 修改任意字段后直接刷新页面，应触发浏览器未保存离开提示。
