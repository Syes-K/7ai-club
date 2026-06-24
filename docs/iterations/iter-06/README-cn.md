# iter-06 — Agent 编排与流式恢复

> **English:** [README.md](./README.md)  
> **中文：** [README-cn.md](./README-cn.md)

> **迭代 ID：** `iter-06`  
> **状态：** **已发布**  
> **路线图阶段：** 2 — Agent 编排基础  
> **计划发布：** 2026-06-24  
> **实际发布：** 2026-06-24  
> **Git tag（可选）：** `iter-06`

---

## 1. 迭代目标

- [x] 将 `/api/chat` 重构为 **WorkflowRunner + Node** 流水线（Vercel AI SDK，不用 LangChain / LangGraph / n8n）
- [x] Chat 内 **实时步骤时间线**（running / success / error，English）
- [x] Supabase **`workflow_runs` / `workflow_step_logs`** 持久化
- [x] **Upstash Redis** 流式恢复；run 结束或异常后 **清理该 run 的 Redis 数据**
- [x] iter-05 聊天行为回归不变（E2E 回归通过）

---

## 2. 范围

### In Scope

| 区域 | 变更 |
|------|------|
| `agent-orchestration` | 新 feature：PRD、技术设计、实现 |
| `POST /api/chat` | Workflow 编排 + resumable stream |
| Chat UI | 步骤时间线 + turn 级状态机 |
| Supabase | workflow 表 + RLS |
| Upstash | Resumable stream 缓冲 + 终态清理 |
| 测试 | 单元 + E2E（`pnpm test:ci` 通过） |

### Out of Scope

- RAG、MCP、Skills node 实现  
- LangChain / LangGraph / n8n  
- 可视化 workflow 编辑器  
- Console 新页面  
- 按助理不同 workflow 图  

---

## 3. 包含的 Features

| Slug | Changelog | 状态 |
|------|-----------|------|
| `agent-orchestration` | [changelog/iter-06-cn.md](../../features/agent-orchestration/changelog/iter-06-cn.md) | **已发布** |
| `mvp-chat` | [changelog/iter-06-cn.md](../../features/mvp-chat/changelog/iter-06-cn.md) | **已发布** |

**交付摘要**（详见 agent-orchestration changelog §3–§4）：

- WorkflowRunner 四步流水线 + 步骤 SSE + DB 日志  
- Turn 级 workflow 状态机 + `AssistantTurn` 单气泡 UI  
- 单 assistant 槽位 + resume 防重复（LLM 刷新单气泡）  
- Upstash resumable stream + run 终态 Redis 清理  

---

## 4. 验收

### 4.1 自动化

- [x] `pnpm lint` 通过（2026-06-24）
- [x] `pnpm build` 通过
- [x] `pnpm test` 通过（47）
- [x] `pnpm test:e2e` 通过（13，含 AC-50）
- [x] `pnpm test:ci` 通过

### 4.2 手工 QA

- [x] 见 [agent-orchestration changelog §6](../../features/agent-orchestration/changelog/iter-06-cn.md) — 已通过（含 LLM 刷新单气泡）

### 4.3 发布

- [x] changelog AC-50–64 已全部勾选
- [x] PRD AC 已同步
- [x] 用户确认：`测试已通过，可发布`
- [x] 实际发布日期：2026-06-24

---

## 5. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | iter-05 已发布；Upstash 账号与环境变量 |
| 风险 | Redis 清理失败 → TTL 兜底 + 日志 |
| 已缓解 | LLM 已落库 + run 仍 active 双气泡 → resume 守卫 + UUID id（changelog §4.3） |
| Follow-up | API 失败路径 E2E mock；500ms 基准测试；双账号 RLS 集成测（不阻塞本迭代） |

---

## 6. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-24 | 创建 iter-06；PRD 已确认 |
| 2026-06-24 | 实现完成；开发阶段人工校准入 changelog |
| 2026-06-24 | QA：`pnpm test:ci` 全绿 |
| 2026-06-24 | 文档结项整理；状态 → **待发布确认** |
| 2026-06-24 | 用户确认发布；迭代 **已发布** |
