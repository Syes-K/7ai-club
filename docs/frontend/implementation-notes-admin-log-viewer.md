# 前端实现说明：管理端日志查看（version=0.0.6）

## 1. 路由与结构

| 路径 | 说明 |
|------|------|
| `src/app/console/layout.tsx` | `ConsoleAntdProvider` + `ConsoleChrome` + 子内容 |
| `src/app/console/page.tsx` | 应用配置（仅内容区，头/导航由 layout） |
| `src/app/console/logs/page.tsx` | 日志页，渲染 `LogViewerApp` |

## 2. 依赖（Ant Design Pro 系）

- **`antd`**、**`@ant-design/pro-components`**：日志页使用 **QueryFilter**（检索项）+ **ProTable**（列表与分页）。
- **`@ant-design/nextjs-registry`**：在 Console 布局内做样式注册，避免 App Router 下样式错乱。
- **`dayjs`**：与 Pro 日期组件一致；已 `locale('zh-cn')`。
- **`/console/logs`** 页面外包一层 **`antd` 的 `App`**，供 `App.useApp()` 使用 `message` 等。

## 3. 组件

| 组件 | 职责 |
|------|------|
| `ConsoleAntdProvider` | `src/app/console/ConsoleAntdProvider.tsx`：`AntdRegistry` + `ConfigProvider`（`zhCN`） |
| `ConsoleChrome` | 标题随路径切换；子导航「应用配置」「日志」；安全提示 |
| `LogViewerApp` | **QueryFilter** 提交后更新 `committedRef` 并 `queryVersion++` 触发 **ProTable** `request`；facets 随 `queryVersion` 刷新 |
| `LogDetailDrawer` | 右侧抽屉详情；Esc 关闭；关闭后 `returnFocusRef` 归还焦点 |

## 4. 数据流

- **查询**：QueryFilter「查询」`onFinish` → 写入 `committedRef` → `queryVersion` 自增 → ProTable 因 `params` 变化重新 `request`；`useEffect` 同步按当前 `committed` 拉 **facets**。
- **重置并查询**：`onReset` 将 `committedRef` 与 **formRef** 表单项恢复为「今日 0:00～当前分钟」等默认值，再 `queryVersion++`。
- **翻页 / 改每页条数**：由 ProTable 内置分页触发 `request`，仍使用 `committedRef` 中条件。

## 5. 与设计差异 / 待加强

- **焦点陷阱**：抽屉内未做完整 focus trap，仅首焦在关闭按钮、Esc 关闭并归还触发按钮焦点（可按 §10 再加强）。
- **URL 同步查询参数**：未实现（设计为可选）。

## 6. 文档路径

- 迭代：`iterations/0.0.6/frontend/implementation-notes-admin-log-viewer.md`
- 同步：`docs/frontend/implementation-notes-admin-log-viewer.md`
