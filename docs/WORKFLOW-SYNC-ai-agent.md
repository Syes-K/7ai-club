# AI Agent 功能 — WORKFLOW 同步索引

对应 [.cursor/agents/WORKFLOW.md](../.cursor/agents/WORKFLOW.md) 四阶段产物路径（需求已前置完成，本次从设计起）。

| 阶段 | 产物路径 | 说明 |
|------|----------|------|
| 1 需求 | `docs/product/prd-ai-agent.md`、`docs/product/user-stories-ai-agent.md` | 已有 |
| 2 设计 | `docs/design/spec-ai-agent.md` | 流程/页面/状态/交互 + US/AC 追溯 |
| 3 服务端 | `docs/backend/*.md` + `src/app/api/chat/`、`src/lib/chat/` | API、模型校验、上游流式转发 |
| 4 前端 | `docs/frontend/*.md` + `src/components/chat/`、`src/app/page.tsx` | 对话 UI、SSE 客户端 |

## 人工确认记录（模板）

- 设计确认：□ 日期 / 备注  
- 服务端确认：□ 日期 / 备注  
- 前端确认：□ 日期 / 备注  

（按 WORKFLOW，各阶段默认应单独确认后再进入下一阶段；若在同一任务中连续交付，请在此补记一次确认。）

## 更新日期

- 2026-03-19：初始化 Next.js 工程并补齐 design / backend / frontend 产物与实现路径。
