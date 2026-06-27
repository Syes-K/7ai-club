# iter-08 变更摘要 — Workflow 步骤 UI 重构

> **English:** [iter-08.md](./iter-08.md)  
> **中文：** [iter-08-cn.md](./iter-08-cn.md)  
> **迭代索引：** [iter-08/README-cn.md](../../iterations/iter-08/README-cn.md)

---

## 1. 主题

| 主题 | PRD | 设计 |
|------|-----|------|
| Workflow 步骤 UI 重构 | [prd/workflow-step-ui-cn.md](../prd/workflow-step-ui-cn.md) | [design/workflow-step-ui-cn.md](../design/workflow-step-ui-cn.md) |

---

## 2. 必读

1. [01-product-requirements-cn.md](../01-product-requirements-cn.md) — 总纲 §2 全局约定  
2. [prd/workflow-step-ui-cn.md](../prd/workflow-step-ui-cn.md) — F-63–F-69 · AC-80–89  
3. [design/workflow-step-ui-cn.md](../design/workflow-step-ui-cn.md) — 组件、协议、migration、§12 验收映射  

---

## 3. 计划交付（编码前）

| 区域 | 路径 / 说明 |
|------|-------------|
| 前端组件 | `components/chat/workflow/` — Panel、List、Registry、node renderers |
| 状态 | `lib/chat/turn-workflow.ts` 简化；移除展示层硬编码顺序 |
| 类型 | `lib/workflow/types.ts` — StepEvent 扩展 |
| 后端 | `lib/workflow/emit-step.ts`、`persistence.ts`、reasoning stream |
| DB | migration — `workflow_step_logs` 扩展 |
| API | `GET /api/chat/[id]/workflow` + stream data parts |
| 测试 | 单元 + E2E 更新；iter-06/07 回归 |

---

## 4. 产品决策记录（iter-08 已确认）

| 项 | 决策 |
|----|------|
| 折叠头 | 仅当前步骤 label（如 `Resolving model…`） |
| Skipped | 列表 muted 显示，不占折叠头当前步骤 |
| Reasoning | 模型 capability 自动；无内容不显示 |
| Reasoning 展开 | 默认折叠 |
| Reasoning 持久化 | 全文写入 DB |
| 旧 4 步 run | 不回填 |
| 步骤子折叠布局 | **Reasoning / 含 detail 步骤**：标题与 chevron 同行；**Summarizing**：折叠前不显示 token 统计，展开后 headline + Markdown |

---

## 5. 验收清单

> **勾选规则：** 仅 **qa-engineer** 在 Phase C4 测试全部通过后勾选。

### 摘要（AC 一览）

- [x] **AC-80** — 进行中步骤面板默认折叠；折叠头显示当前 running 步骤 + loading
- [x] **AC-81** — 完成后默认折叠；折叠头显示 N steps completed 或 error 计数
- [x] **AC-82** — 可点击折叠头展开/收起完整步骤列表
- [x] **AC-83** — 摘要 detail 为 muted Markdown
- [x] **AC-84** — Reasoning 模型：Reasoning 步骤流式 + 展开打字机
- [x] **AC-85** — 非 Reasoning 模型：无 Reasoning 步骤
- [x] **AC-86** — 对话中刷新：折叠头与 stream 恢复正确
- [x] **AC-87** — 历史对话：每轮默认折叠，展开与 DB 一致
- [x] **AC-88** — Skipped 步骤 muted 显示，不占折叠头
- [x] **AC-89** — iter-06/07 workflow E2E 回归通过

### 5.1 Test Matrix（qa-engineer · Phase C0）

| AC ID | 前提 | 操作步骤 | 期望结果 | 验证方式 | 自动化覆盖 | 证据（qa 填写） |
|-------|------|----------|----------|----------|------------|-----------------|
| AC-80 | … | … | … | manual | `iter08-manual-qa.spec.ts` M-01 | Playwright pass：折叠+spinner 或 fast-stream 注释；7 steps 新 run |
| AC-81 | … | … | … | e2e + unit | M-01 settle + M-02 | `Workflow · 7 steps completed` 折叠 |
| AC-82 | … | … | … | e2e + manual | M-02 | chevron toggle aria-expanded |
| AC-83 | … | … | … | manual | M-03 + unit | 用户手工验证 pass（Show summary → muted Markdown）；Playwright skip 因 E2E 无 summary 数据 |
| AC-84 | … | … | … | manual | M-04 | Reasoning 行 + Show/Hide reasoning + pre 非空 |
| AC-85 | … | … | … | unit + manual | M-05 | 非 reasoning 模型无 Reasoning 行 |
| AC-86 | … | … | … | manual | M-06 | 流式中 reload → 恢复并完成 |
| AC-87 | … | … | … | e2e + manual | M-07 | reload 后 ≥2 折叠头；首轮 expand 见 Validate request |
| AC-88 | … | … | … | unit + manual | M-08 | Summarizing history Skipped + opacity-60 |
| AC-89 | … | … | … | static + unit + e2e | 全量 + M-01–M-08 | lint/build/86 unit/13+7 e2e pass |

**C0 摘要：** 10 条 AC · 自动化 9 条有部分覆盖 · **manual 必选** AC-80/83/84/86 + 部分 AC-87

---

## 6. 门禁与阶段状态

| 阶段 | 确认话术 / 状态 | 日期 |
|------|-----------------|------|
| PRD | `PRD 已确认，可进入技术设计` | 2026-06-26 |
| 技术 design §12 | 技术设计草稿（待确认） | 2026-06-26 |
| 编码 | Phase B 交付完成 | 2026-06-26 |
| 测试 C0 | Test Matrix + §12 Manual Script 已落盘 | 2026-06-26 |
| 测试 C1–C3 | C2 自动化 + Playwright M-01–M-08 pass；M-03 用户手工 pass | 2026-06-26 |
| 发布 | **已发布**（用户确认完成迭代 · 2026-06-26） | 2026-06-26 |

---

## 7. 人工验证发现与修复

> 开发 / 联调期发现；**不等同于 AC 勾选**。修复后由 qa 在 Test Matrix 中回归。

| ID | 现象 | 根因 | 修复 | 涉及路径 |
|----|------|------|------|----------|
| H-01 | 历史 assistant 无 Workflow 面板；新消息报错 `Could not find the 'detail' column…` | iter-08 migration 未应用到远程 DB；PostgREST schema cache 无新列 | 远程执行 `20260626000000_iter08_workflow_step_ui.sql` + `NOTIFY pgrst, 'reload schema'`；`persistence.ts` 检测列缺失时回退旧版 upsert/select | `lib/workflow/persistence.ts`、`supabase/migrations/…` |
| H-02 | 历史轮次恢复后仍无步骤列表 | workflow 仅在 `conversationId` 变化时拉取 | `use-turn-workflow` 在 **user 消息数变化** 时也触发 reload | `lib/chat/use-turn-workflow.ts` |
| H-03 | 折叠头无法看出可点击展开 | 仅有 label，无 affordance | `WorkflowStepHeader` 右侧 **chevron**（无文字）；`aria-label` 含 Show/Hide steps | `components/chat/workflow/workflow-step-header.tsx` |
| H-04 | Console **Test** `deepseek-v4-pro` 失败 `Empty response from provider` | V4 默认 thinking → 短 probe 只有 `reasoning_content`；`generateText` 只认 `text`；`providerOptions` 的 `thinking` / `enable_thinking` **未被 @ai-sdk/openai 转发** | 新增 `lib/llm/connectivity-test.ts`：**直连** `POST /chat/completions`，按 provider 写入 body（Bailian `enable_thinking: false`，DeepSeek `thinking.disabled`）；接受 `reasoning_content` 兜底 | `lib/llm/connectivity-test.ts`、`lib/llm/resolve-user-model.ts` |
| H-05 | Bailian `qwen3.6-plus` / `deepseek-v4-pro` 聊天无 **Reasoning** 步骤 | ① `getStreamTextProviderOptions` 误用 **`LLM_PROVIDER` 环境变量**；② `createOpenAI` 不解析 `reasoning_content`；③ options 键误用 `openai` | ① 按 `resolved.provider`；② **`createOpenAICompatible`**；③ 键对齐 bailian/deepseek；④ 白名单含 deepseek-v4 | `lib/llm/provider.ts`、`lib/llm/model-capabilities.ts` | |
| H-06 | Reasoning 展开后流式打字不跟随滚动 | `pre` 无 programmatic scroll | streaming 时滚到底 + 展开 `scrollIntoView` | `components/chat/workflow/reasoning-step-row.tsx` |
| H-07 | Reasoning 阶段页面卡顿；Console 2000+ render | 每 token `setStore` + 全历史 `AssistantTurn` 重渲染 | **Reasoning buffer**（`reasoning-detail-buffer.ts`）：delta 不入 React state，300ms 合并 flush；折叠时零订阅；展开 `<pre>` 直写 DOM | `lib/chat/reasoning-detail-buffer.ts`、`components/chat/workflow/reasoning-detail-panel.tsx` |
| H-08 | AI 回复后 `/workflow` 请求风暴（数十 pending） | `status→ready` 后 1.5s×20 轮询且无 in-flight 去重 | 去重 + settled 即停；最多 5 次 / 2s | `lib/chat/use-turn-workflow.ts` |
| H-09 | LLM 流式时历史轮 `AssistantTurn` 随 token 重渲染 | `ChatMessages` 无 memo | `AssistantTurn` / `UserMessage` / `AssistantMessage` **memo** + 浅比较 | `assistant-turn.tsx`、`chat-messages.tsx` |
| H-10 | 折叠头 icon 与步骤列表不对齐 | header `px-1` + `gap-1.5` vs 行 `gap-2` | 统一 `items-start gap-2` + icon `mt-0.5`；列表 `list-none p-0` | `workflow-step-header.tsx`、`workflow-step-list.tsx` |

---

## 8. 编码后 UX / 行为确认（非缺陷）

| ID | 项 | 结论 |
|----|-----|------|
| B-01 | Reasoning **running** 时 Generate response 也为 **running** | **符合 PRD**：同一 `streamText` 流并行 |
| B-02 | 折叠头在双 running 时显示哪一步 | Reasoning (45) 优先 → `Workflow · Reasoning…` |
| B-03 | 折叠头 chevron | 仅图标；`aria-label` 含 Show/Hide steps |
| B-04 | Reasoning / Summarizing 子折叠布局 | 标题 + chevron 同一行；Summarizing token 统计仅在展开内显示 |
| B-05 | LLM 正文流式渲染 | **流式阶段亦用 Markdown**（`MarkdownContent`），与完成后一致 |
| B-06 | Reasoning 详情格式 | 流式 / 完成均 **`<pre>`** plain text，不用 Markdown（性能） |

---

## 9. Phase B 实际交付补充（相对 §3 计划）

| 区域 | 路径 |
|------|------|
| 连通性测试 | `lib/llm/connectivity-test.ts` |
| 模型 capability | `lib/llm/model-capabilities.ts` |
| 折叠头算法 | `lib/workflow/step-panel-header.ts` |
| 步骤排序 / payload | `lib/workflow/sort-steps.ts`、`lib/workflow/step-payload.ts` |
| 节点 catalog | `lib/workflow/node-catalog.ts` |
| 单元测试 | `tests/unit/workflow/step-panel-header.test.ts`、`sort-steps.test.ts`、`step-payload.test.ts`；`tests/unit/llm/model-capabilities.test.ts` |
| E2E 手工 QA | `tests/e2e/iter08-manual-qa.spec.ts`（M-01–M-09） |
| Reasoning buffer | `lib/chat/reasoning-detail-buffer.ts`；`tests/unit/chat/reasoning-detail-buffer.test.ts` |
| Reasoning 详情面板 | `components/chat/workflow/reasoning-detail-panel.tsx` |
| Migration | `supabase/migrations/20260626000000_iter08_workflow_step_ui.sql` |

---

## 12. 手工 QA 脚本（qa-engineer · Phase C0，C3 执行）

| # | 映射 AC | 场景 | 前提 | 步骤 | 期望 | 结果 | 证据 |
|---|---------|------|------|------|------|------|------|
| M-01 | AC-80 | 流式中折叠默认 | qwen3.6+ | 发消息、观察最后一轮折叠头 | 折叠+spinner | **pass** | `iter08-manual-qa.spec.ts` 5.6m run |
| M-02 | AC-82 | 折叠头 toggle | 已完成一轮 | 点两次折叠头 | expand/collapse | **pass** | aria-expanded + Validate request |
| M-03 | AC-83 | Summary Markdown | 有 summary 的对话 | 展开 Show summary | muted Markdown | **pass** | 用户手工验证（2026-06-26）；E2E skip |
| M-04 | AC-84 | Reasoning 流式 | reasoning 模型 | Show reasoning | 非空 pre | **pass** | qwen3.6-plus |
| M-05 | AC-85 | 无 Reasoning | 非 reasoning 模型 | 展开 workflow | 无 Reasoning | **pass** | |
| M-06 | AC-86 | 刷新恢复 | 流式中 | reload | 继续完成 | **pass** | |
| M-07 | AC-87 | 历史多轮 | reload 后 | 首轮折叠+expand | 步骤一致 | **pass** | ≥2 workflow 头 |
| M-08 | AC-88 | Skipped muted | 短对话 | 展开 workflow | Skipped muted | **pass** | opacity-60 |
| M-09 | H-04 | 模型 Test V4 | custom deepseek-v4-pro | Console Test | Passed | **skip** | 无 custom 行（仅 platform default） |

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-26 | 创建 iter-08 changelog — PRD 已确认（推荐默认值） |
| 2026-06-26 | 技术设计草稿 — [design/workflow-step-ui-cn.md](../design/workflow-step-ui-cn.md) |
| 2026-06-26 | Phase B 编码交付 |
| 2026-06-26 | 联调：§7 H-01–H-06；§8 UX 确认 |
| 2026-06-26 | qa C3：Playwright `iter08-manual-qa.spec.ts` 7 pass / 2 skip；C4 勾选 AC-80–82,84–89 |
| 2026-06-26 | AC-83 用户手工验证 pass；C4 勾选 AC-83 · **AC-80–89 全部完成** |
| 2026-06-26 | 发布前 UX：B-04 步骤行 inline chevron（Reasoning / Summarizing）；迭代 **已发布** |
| 2026-06-26 | 发布后补丁：H-07–H-10 性能与对齐；B-05 LLM 流式 MD；B-06 Reasoning 保持 pre；90 unit tests |
