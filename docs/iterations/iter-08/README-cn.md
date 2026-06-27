# iter-08 — Workflow 步骤 UI 重构

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **迭代 ID：** `iter-08`  
> **状态：** **已发布**  
> **路线图阶段：** 2 — Agent 编排  
> **计划发布：** 2026-06-26  
> **实际发布：** 2026-06-26  
> **Git tag（可选）：** `iter-08`

---

## 1. 迭代目标

- [x] Workflow 步骤面板默认折叠，折叠头显示当前步骤与状态
- [x] 摘要 detail 改为 muted Markdown；Reasoning 流式节点（capability 自动）
- [x] 前端 Registry 分层 + 动态节点协议；API/DB schema 整理
- [x] 三态展示统一（对话中 / 刷新 / 历史）
- [x] iter-06/07 回归通过

---

## 2. 范围

### In Scope

| 区域 | 变更 |
|------|------|
| `agent-orchestration` | 步骤 UI 重构 PRD F-63–F-69 |
| 前端 | `components/chat/workflow/` Registry 架构 |
| 后端 | StepEvent 扩展、reasoning stream、persistence |
| DB | `workflow_step_logs` migration |
| 测试 | 单元 + E2E + iter-06/07 回归 + `iter08-manual-qa` |

### Out of Scope

- Workflow 可视化编辑器
- Preferences「Show reasoning」开关
- 旧 4 步 run 数据回填
- RAG / MCP / Skills 新节点

---

## 3. 包含的 Features

| Slug | Changelog | 状态 |
|------|-----------|------|
| `agent-orchestration` | [changelog/iter-08-cn.md](../../features/agent-orchestration/changelog/iter-08-cn.md) | **已发布** |

**必读 PRD：** [workflow-step-ui-cn.md](../../features/agent-orchestration/prd/workflow-step-ui-cn.md)

---

## 4. 验收

### 4.1 自动化

- [x] `pnpm lint` — 2026-06-26
- [x] `pnpm build` — 2026-06-26
- [x] `pnpm test` — 90 tests
- [x] `pnpm test:e2e` — 13 + 7（`iter08-manual-qa`）

### 4.2 手工 QA

- [x] AC-80–89 — Playwright + 用户手工 AC-83
- [x] H-04 — 联调 §7 人工验证（M-09 E2E skip）

### 4.3 发布

- [x] AC-80–89 已全部勾选（qa-engineer · 2026-06-26）
- [x] 用户确认完成迭代（2026-06-26）

### 4.4 编码后人工变更

> [changelog §7–§9](../../features/agent-orchestration/changelog/iter-08-cn.md)

| 类别 | 摘要 |
|------|------|
| DB / 恢复 | migration + schema reload；persistence 旧列回退；按消息数重载 workflow |
| Console 模型 Test | `connectivity-test.ts` 直连 API |
| Reasoning 链路 | openai-compatible 客户端；provider options；V4/Qwen3 白名单 |
| UI | 折叠头 chevron；Reasoning 自动滚动；**步骤行 inline chevron**（B-04） |
| 性能 / 对齐 | Reasoning buffer（H-07）；workflow 轮询去重（H-08）；AssistantTurn memo（H-09）；header 对齐（H-10） |
| 渲染 | LLM 流式 Markdown（B-05）；Reasoning 保持 `<pre>`（B-06） |

---

## 5. 依赖与风险

| 项 | 说明 |
|----|------|
| 依赖 | iter-07 已发布 |
| 风险（已缓解） | Reasoning provider 差异 → capability 检测 + Bailian/DeepSeek 验证 |
| 风险（已缓解） | 回归 → iter-06/07 + iter08-manual-qa E2E |

---

## 6. 门禁记录

| 日期 | 事件 |
|------|------|
| 2026-06-26 | PRD 已确认 |
| 2026-06-26 | Phase B 编码交付 |
| 2026-06-26 | 联调 H-01–H-06 |
| 2026-06-26 | qa C0–C4：AC-80–89 全部勾选 |
| 2026-06-26 | 发布前 UX B-04；**迭代已发布** |
| 2026-06-26 | 发布后补丁 H-07–H-10、B-05–B-06；changelog §7/§8 更新 |

---

## 7. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-26 | 创建 iter-08 |
| 2026-06-26 | 测试验收 + 发布 |
