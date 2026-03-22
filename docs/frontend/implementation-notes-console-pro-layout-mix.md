# 前端实现说明：后台 ProLayout（mix）（version=0.0.8）

## 1. 依据

- 需求：[`iterations/0.0.8/product/prd-console-pro-layout-mix.md`](../../iterations/0.0.8/product/prd-console-pro-layout-mix.md)
- 设计：[`iterations/0.0.8/design/spec-console-pro-layout-mix.md`](../../iterations/0.0.8/design/spec-console-pro-layout-mix.md)
- 服务端：[`iterations/0.0.8/backend/implementation-notes-console-pro-layout-mix.md`](../../iterations/0.0.8/backend/implementation-notes-console-pro-layout-mix.md)（无 API 变更）

## 2. 代码变更摘要

| 文件 | 说明 |
|------|------|
| [`src/components/console/ConsoleProShell.tsx`](../../src/components/console/ConsoleProShell.tsx) | 新增 Client 壳：`ProLayout` `layout="mix"`，`title="后台管理"`，`logo={false}`；`route` 下两项菜单带 `SettingOutlined` / `FileSearchOutlined`；`menuItemRender` 用 Next `Link`；`actionsRender` 提供「返回对话」→ `/`；`footerRender={false}`；`pageTitleRender` 为「子页 · 后台管理」。内容区外包 `PageContainer`（`breadcrumbRender={false}`），`title` 随路径为「应用配置」或「日志」；内层保留 `bg-zinc-50 dark:bg-zinc-950` 与原子页布局兼容。 |
| [`src/app/console/layout.tsx`](../../src/app/console/layout.tsx) | 用 `ConsoleProShell` 替换原 `ConsoleChrome` + 外层 zinc 容器。 |
| `src/components/console/ConsoleChrome.tsx` | **已删除**（能力由 ProLayout 承接）。 |

## 3. 与设计的对齐说明

- **Hydration**：`ProLayout` 依赖 `useBreakpoint()` 生成 `screen-*` 等 `className`，SSR 与客户端视口不一致会触发 React hydration mismatch。`ConsoleProShell` 在 **`useEffect` 后置 `layoutReady`**，首帧仅渲染与 SSR 一致的 **`min-h` + zinc 背景 + children**；挂载后再渲染 `ProLayout`（首屏可能有极短壳层切换，无控制台报错）。
- **mix + 侧栏菜单 + 图标**：已实现；无顶栏横向子导航。
- **二级标题**：`PageContainer` 展示当前页标题；侧栏品牌为「后台管理」。
- **暗色**：沿用 Tailwind `dark:` 内容区背景；ProLayout 壳层为 antd 默认 token（与迭代前「antd 壳 + zinc 内容」混合形态类似）。若需全壳 `darkAlgorithm`，可在 `ConsoleAntdProvider` 内与 `prefers-color-scheme` 或站点主题同步（后续迭代）。
- **可访问性**：「返回对话」为真实 `Link`；侧栏折叠按钮由 ProLayout/Menu 默认提供。

## 4. 自测建议

1. 访问 `/console`：侧栏「应用配置」选中，`PageContainer` 标题为「应用配置」，浏览器标题含「应用配置 · 后台管理」。
2. 访问 `/console/logs`：侧栏「日志」选中，标题为「日志」；日志筛选与表格行为与改造前一致。
3. 点击「返回对话」进入 `/`。
4. 窄屏：侧栏可折叠，折叠后图标 + Tooltip 可访问两项（依赖 Pro 默认行为）。

## 5. 文档路径

- **主路径**：`iterations/0.0.8/frontend/implementation-notes-console-pro-layout-mix.md`
- **同步路径**：`docs/frontend/implementation-notes-console-pro-layout-mix.md`
