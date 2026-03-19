# AI Agent 功能 — WORKFLOW 同步索引

对应 [.cursor/agents/WORKFLOW.md](../.cursor/agents/WORKFLOW.md) 四阶段产物路径（需求已前置完成，本次从设计起）。

**版本化全流程**：若按 [.cursor/rules/product-design-dev-workflow.mdc](../.cursor/rules/product-design-dev-workflow.mdc) 执行，文档主路径为 `iterations/{version}/product|design|backend|frontend/`，并与下表 `docs/...` **双写同步**。

| 阶段 | 产物路径 | 说明 |
|------|----------|------|
| 1 需求 | `docs/product/prd-ai-agent.md`、`docs/product/user-stories-ai-agent.md` | 基线 |
| 1 需求（迭代 **0.0.1**） | `iterations/0.0.1/product/` ↔ `docs/product/prd-chat-layout-buttons.md`、`user-stories-chat-layout-buttons.md` | 模型位置 + 操作按钮图标 |
| 2 设计 | `docs/design/spec-ai-agent.md` | 流程/页面/状态/交互 + US/AC 追溯 |
| 2 设计（迭代 **0.0.1**） | `iterations/0.0.1/design/` ↔ `docs/design/spec-chat-layout-buttons-0.0.1.md` | 顶栏模型 + footer 精简 + 按钮图标 |
| 3 服务端 | `docs/backend/*.md` + `src/app/api/chat/`、`src/lib/chat/` | API、模型校验、上游流式转发 |
| 3 服务端（迭代 **0.0.1**） | `iterations/0.0.1/backend/` ↔ `docs/backend/implementation-notes-0.0.1.md` | 无 API 变更说明 |
| 4 前端 | `docs/frontend/*.md` + `src/components/chat/`、`src/app/page.tsx` | 对话 UI、SSE 客户端 |
| 4 前端（迭代 **0.0.1**） | `iterations/0.0.1/frontend/` ↔ `docs/frontend/implementation-notes-0.0.1.md` | 顶栏模型 + 按钮图标 |

## 人工确认记录（模板）

- 设计确认：□ 日期 / 备注  
- 服务端确认：□ 日期 / 备注  
- 前端确认：□ 日期 / 备注  

（按 WORKFLOW，各阶段默认应单独确认后再进入下一阶段；若在同一任务中连续交付，请在此补记一次确认。）

## 更新日期

- 2026-03-19：初始化 Next.js 工程并补齐 design / backend / frontend 产物与实现路径。
- 2026-03-19：绑定 **version=0.0.1**，新增对话页布局/按钮增量 PRD 与用户故事（见上表）。
- 2026-03-19：**0.0.1 设计定稿** `spec-chat-layout-buttons-0.0.1.md`；`spec-ai-agent.md` 增 §2.3 指向该增量。
- 2026-03-19：**0.0.1 服务端**：无契约变更，见 `implementation-notes-0.0.1.md`。
- 2026-03-19：**0.0.1 前端**：`ChatApp.tsx` 布局与图标；见 `docs/frontend/implementation-notes-0.0.1.md`。
