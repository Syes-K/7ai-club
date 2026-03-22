# 服务端说明：后台 ProLayout（mix）壳层（version=0.0.8）

## 1. 结论

本迭代**不修改** Next.js Route Handlers、Server Actions、数据模型或日志/配置相关服务端逻辑；**无新增 API**、**无契约变更**。

依据：

- [`iterations/0.0.8/product/prd-console-pro-layout-mix.md`](../../iterations/0.0.8/product/prd-console-pro-layout-mix.md) — Out of Scope：不引入新 API 与鉴权模型。
- [`iterations/0.0.8/design/spec-console-pro-layout-mix.md`](../../iterations/0.0.8/design/spec-console-pro-layout-mix.md) — 第 9 节：无新接口、无数据模型变更。

## 2. 对前端的交接

- 前端仅需替换 `/console` 下 **布局与导航壳**；对接的既有接口（如日志查询、配置读写等）**路径、方法、请求/响应**与迭代前一致，可继续参照既有 `docs/backend/` 与历史迭代文档（如 `0.0.4`、`0.0.6` 等）中已定义的约定。
- 若后续在浏览器侧新增仅与 UI 相关的路由（`/console`、`/console/logs`），**不需要**服务端新增路由。

## 3. 自测（服务端）

- **回归**：对现有依赖 API 的页面执行既有用例即可；本迭代无服务端代码 diff 时无需单独扩写自动化。
- **构建**：保证仓库 `npm run build`（或项目既定命令）通过；若有 CI，以 CI 为准。

## 4. 文档路径

- **主路径**：`iterations/0.0.8/backend/implementation-notes-console-pro-layout-mix.md`
- **同步路径**：`docs/backend/implementation-notes-console-pro-layout-mix.md`
