# 前端实现说明：提示词管理（version=0.0.9）

## 1. 路由与入口

- 页面：`src/app/console/prompts/page.tsx`（`force-dynamic`，首屏 `readPromptTemplatesWithMeta()` 与内置默认一并注入表单）。  
- 导航：`ConsoleProShell` 增加 `/console/prompts`、`CommentOutlined`、页标题「提示词管理」。

## 2. 组件

- `src/components/console/PromptTemplatesForm.tsx`（client）：  
  - 中文卡片标题与 **模板正文** 标签；**antd `Tooltip` + `QuestionCircleOutlined`** 承载与设计 §2.5 一致的完整说明。  
  - 卡片内 **正文段落** 再摘要含义与用法（无需悬停即可阅读）。  
  - 占位符说明区：注入键写「无」；系统键用小表格说明 `{{maxChars}}`。  
  - 脚注 **配置键** 英文，便于对照 `prompt-templates.json`。  
  - 保存前调用 **`validatePromptTemplatesForSave`**（与后端同源），再 `PUT /api/console/prompt-templates`。  
  - **恢复默认**：`confirm` 后表单回填 `builtin`（来自 GET 等价数据，首屏由 `BUILTIN_PROMPT_TEMPLATES` 传入）；须再点保存写盘（与设计 D4 一致）。

## 3. 视觉

- 与 `ConsoleConfigForm` 对齐：`max-w-2xl`、卡片 `rounded-2xl border`、成功/错误/amber 提示条、主按钮 violet。

## 4. 文档路径

- 迭代：`iterations/0.0.9/frontend/implementation-notes-prompt-templates-admin.md`  
- 同步：`docs/frontend/implementation-notes-prompt-templates-admin.md`
