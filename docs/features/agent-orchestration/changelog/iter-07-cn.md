# iter-07 变更摘要 — 历史对话摘要

> **English:** [iter-07.md](./iter-07.md)  
> **中文：** [iter-07-cn.md](./iter-07-cn.md)  
> **迭代索引：** [iter-07/README-cn.md](../../iterations/iter-07/README-cn.md)

---

## 1. 主题

| 主题 | PRD | 设计 |
|------|-----|------|
| 滚动摘要 + Workflow Nodes + 步骤展开 | [prd/history-summarization-cn.md](../prd/history-summarization-cn.md) | [design/history-summarization-cn.md](../design/history-summarization-cn.md) |

**关联：**

- [console/changelog/iter-07-cn.md](../../console/changelog/iter-07-cn.md) — Preferences Conversation memory  
- [mvp-chat/changelog/iter-07-cn.md](../../mvp-chat/changelog/iter-07-cn.md) — Clear chat 扩展  

---

## 2. 必读

1. [01-product-requirements-cn.md](../01-product-requirements-cn.md) — §2 全局约定  
2. [prd/history-summarization-cn.md](../prd/history-summarization-cn.md) — 全文  
3. [console/prd/profile-cn.md](../../console/prd/profile-cn.md) — §3.4 Conversation memory  
4. [mvp-chat/prd/chat-experience-cn.md](../../mvp-chat/prd/chat-experience-cn.md) — F-14 Clear chat  
5. [design/workflow-orchestration-cn.md](../design/workflow-orchestration-cn.md) — iter-06 基线  
6. [design/history-summarization-cn.md](../design/history-summarization-cn.md) — **iter-07 技术设计**

---

## 3. 计划交付（编码前）

| 区域 | 路径 / 说明 |
|------|-------------|
| Workflow nodes | `lib/workflow/nodes/load-history-summary.ts`、`evaluate-summarization.ts`、`summarize-history.ts`、`post-llm-memory.ts` |
| Context 组装 | `lib/memory/assemble-llm-messages.ts` — LLM 输入 = summary + active messages |
| DB | `20260625000000_iter07_conversation_memory.sql` + `20260625230000_iter07_messages_update_workflow_user_message.sql` |
| Preferences API/UI | `components/console/preferences-card.tsx` + profile save |
| Clear chat | `clearConversationMessages` 扩展删 summary |
| Step UI | `workflow-step-timeline.tsx` — 步骤行可展开长 summary |
| Chat route | `app/api/chat/route.ts` — pre-LLM nodes + **post-LLM memory 在 `llm_stream` 完成后**（非 stream `onFinish`） |
| Workflow 恢复 | `GET .../workflow` 返回 `{ runs[] }`；`match-runs-to-messages.ts` 按时间窗口匹配 |
| 测试 | `lib/memory/*` · `turn-workflow` · `match-runs-to-messages` 单元测试 |

---

## 4. 产品决策记录（iter-07 已确认）

| 项 | 决策 |
|----|------|
| 归档方式 | **软归档** — DB 保留，LLM 排除，聊天区仍可见 |
| 轮数定义 | **1 user + 1 assistant = 1 turn**；未完成轮不计 |
| 触发策略 | **混合 OR** — turns 或 tokens 超阈即评估 |
| 保留策略 | **混合 AND** — 保留最近 N 轮 + token 上限 |
| 摘要模型 | Preferences **可配置**；默认 Same as chat model |
| 系统预设默认值 | Enable On · trigger 20/8000 · retain 4/2000 |
| 用户可见性 | **仅 workflow 步骤**；inline 折叠展开；无系统气泡 |
| Clear chat | 删除 messages + memory summary |
| **Node 时机** | **方案 B** — `load_history_summary` 在 LLM 前；`evaluate` + `summarize` 在 assistant 落库后 |
| **整轮原子性** | token/轮数混合下，归档与保留均以 **完整轮** 为最小单位；token 仅用于触发与 retain 收缩，不 mid-turn 切分 |

---

## 5. 验收清单

> 由 **qa-engineer** 验收；编码完成后勾选。

### 摘要与 Workflow（AC-70–77）

- [x] **AC-70** — Preferences 摘要 5 项 + Summary model；Save + 校验  
- [x] **AC-71** — Enable Off 跳过摘要路径  
- [x] **AC-72** — 超阈值：assistant 落库后 summarize；**下一轮起**归档不进 LLM；首次触发可无 prior summary  
- [x] **AC-73** — 未超阈值：LLM 后 `Skipped`  
- [x] **AC-74** — Clear chat 清 summary + 更新确认文案  
- [x] **AC-75** — 步骤 inline 展开摘要详情  
- [x] **AC-76** — 摘要模型兜底 chat 模型  
- [x] **AC-77** — iter-05/06 回归  

---

## 6. 门禁与阶段状态

| 阶段 | 确认话术 / 状态 | 日期 |
|------|-----------------|------|
| PRD | `PRD 已确认，可进入技术设计` | 2026-06-25 |
| 技术设计 | `技术设计已确认，可开始编码` | 2026-06-25 |
| 编码 | Phase B 交付完成 | 2026-06-25 |
| 测试验收 | AC-70–77 已通过（qa-engineer 手工 + 自动化） | 2026-06-26 |
| 发布 | **已发布**（本地迭代完成） | 2026-06-26 |

**自动化（2026-06-26 复验）：** `pnpm lint` · `pnpm build` · `pnpm test`（73）· `CI=1 pnpm test:e2e`（13）均通过

> E2E 本地请用 `CI=1 pnpm test:e2e`，避免 `reuseExistingServer` 复用旧 dev 进程（仅 4 步 workflow）。

---

## 12. 手工 QA 清单（qa-engineer · 2026-06-26 已通过）

> 下列项已由 qa-engineer 确认；§5 AC-70–77 已勾选。

| # | 场景 | 结果 |
|---|------|------|
| M-01 | Preferences AC-70 | pass |
| M-02 | Enable Off AC-71 | pass |
| M-03 | 超阈值 AC-72 | pass |
| M-04 | 未超阈 AC-73 | pass |
| M-05 | Clear chat AC-74 | pass |
| M-06 | 步骤展开 AC-75 | pass |
| M-07 | 摘要模型 AC-76 | pass |
| M-08 | 回归 AC-77 | pass |
| M-09 | H 项回归 | pass |

---

## 7. 人工验证发现与修复

> 开发期用户在真实会话中验证；下列项已在代码中修复，**不等同于 AC 勾选**。

| # | 现象 | 根因 | 修复 |
|---|------|------|------|
| H-01 | 首条消息报错 `summarization_enabled does not exist` | 远程 Supabase 未应用 iter-07 migration | 应用 `20260625000000_iter07_conversation_memory.sql` |
| H-02 | LLM 完成后步骤只剩 evaluate + summarize；summarize 卡在 running | post-LLM  settlement / merge 时序；`onFinish` 过早结束 run | post-LLM 移至 `runLlmStreamNode` **之后**；`isTurnWorkflowSettled` 等 post-LLM 完成；`mergeWorkflowSteps` |
| H-03 | 刷新后仅最后一条 AI 回复有 workflow steps | 恢复逻辑只取最新 run | `applyAllRestoredWorkflows` + API 返回全部 run |
| H-04 | 刷新后历史 turn 仅 4 步（缺 summary nodes） | 28 runs / 9 user msgs，顺序推断 run 错位 | `matchBestRunPerUserMessage` 按 user 消息时间窗口匹配 |
| H-05 | 刚摘要完下一轮仍加载全量历史并再次摘要 | `messages` 无 UPDATE RLS → `summarized_at` 静默失败 | migration `messages_update_own`；`markMessagesSummarized` 校验更新行数 |
| H-06 | 发送消息报错 `invalid input syntax for type uuid: "…"` | `workflow_runs.user_message_id` 写入客户端 AI SDK id | `saveUserMessage` 返回 DB UUID；`createWorkflowRun` UUID 校验 |
| H-07 | Load context 显示「17 messages」易误解为全量进 LLM | 展示的是 UI 消息总数 | 改为 `X active · Y total`（active = 未归档） |

---

## 8. 体验与实现优化

| 项 | 说明 |
|----|------|
| 聊天滚动 | `use-stick-to-bottom` — 发送/流式时贴底；用户上滑阅读时暂停自动滚动（见 [mvp-chat changelog §4](../../mvp-chat/changelog/iter-07-cn.md)） |
| Workflow 恢复 | `workflow_runs.user_message_id` 关联 user turn；旧 run 无该字段时按时间窗口推断 |
| 步骤持久化 | 每步 `upsertWorkflowStepLog`；刷新后从 DB 恢复 7 步完整链路（iter-07 新 run） |
| 轮询恢复 | `chatStatus → ready` 时有限次轮询 workflow API，避免 post-LLM 步骤未落库 |
| 单元测试 | 新增 `match-runs-to-messages.test.ts`；扩展 `turn-workflow.test.ts` |

---

## 9. 步骤指标说明（人工 QA 参考）

Preferences 示例：**Trigger 4 turns / 2000 tokens · Retain 2 turns / 500 tokens**。

| 步骤 | 展示示例 | 含义 |
|------|----------|------|
| **Load context** | `5 active · 21 total` | **active** = 未归档、会进 LLM 的条数；**total** = 会话全部消息（含已 soft-archive） |
| **Loading memory summary** | `Summary loaded (~774 tokens)` | DB 中 rolling summary 的 `token_estimate`；供 **本轮** Chat LLM 注入 system |
| **Evaluating context size** | `2 turns · ~1.0k tokens` | **turns** = active 中完整 user+assistant 对数；**tokens** = summary + active 消息估算之和 |
| **Summarizing history** | `Skipped` | `turns ≤ trigger` **且** `tokens ≤ trigger`（OR 触发，未达则 Skip） |

**典型一轮（已摘要会话）：** Load 前 active 常为 `retain_turns × 2 + 1`（含本轮 user）；Evaluating 在 assistant 落库后应含 **本轮完整对**（PRD 方案 B）。若 Evaluating 的 turn 数比预期少 1，见 §10。

---

## 10. 已知限制与待办

| 项 | 说明 | 优先级 |
|----|------|--------|
| Evaluating turn 展示 | 个别会话 Evaluating 仍显示「2 turns」而非含本轮的「3 turns」；Skip 判断仍正确，待核对 post-LLM reload 与 turn 计数 | P2 |
| 历史 run 仅 4 步 | iter-07 **之前** 的 workflow run DB 仅 persist 4 node，刷新后无法补全 7 步 | 预期行为 |
| `user_message_id` 回填 | 旧 run 依赖时间窗口推断；可选 SQL 回填（未强制） | P3 |
| E2E | iter-06 workflow + 全量 13 用例已通过（`CI=1 pnpm test:e2e`） | 已关闭 |

---

## 11. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-25 | 创建 iter-07 changelog — PRD 已确认 |
| 2026-06-25 | 采用 **方案 B** — PRD + 技术设计同步 |
| 2026-06-25 | **整轮原子性** — PRD §5.3.1 + design `select-archive` 算法 |
| 2026-06-25 | **技术设计已确认** — 开始编码 |
| 2026-06-25 | §6–§10 — 编码交付、人工 QA 修复、优化、指标说明、已知限制 |
| 2026-06-26 | §12 手工 QA 清单；自动化复验通过；E2E workflow 用例适配 iter-07 |
| 2026-06-26 | AC-70–77 勾选；迭代 **已发布** |
