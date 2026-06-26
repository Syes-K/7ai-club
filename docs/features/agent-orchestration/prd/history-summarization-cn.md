# 历史对话摘要

> **English:** [history-summarization.md](./history-summarization.md)  
> **中文：** [history-summarization-cn.md](./history-summarization-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-07  
> **关联：** [console/prd/profile-cn.md](../../console/prd/profile-cn.md) · [workflow-orchestration-cn.md](./workflow-orchestration-cn.md) · [mvp-chat/prd/chat-experience-cn.md](../../mvp-chat/prd/chat-experience-cn.md)

---

## 1. 范围

F-60 — 对话级 **滚动摘要（rolling summary）**：长对话超阈值时压缩早期消息，保留近期完整轮次，供 LLM 上下文使用。  
F-61 — Workflow 独立 Node：`load_history_summary`、`evaluate_summarization`、`summarize_history`。  
F-62 — 步骤时间线内 **inline 折叠展开** 摘要详情（English）。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-60 | 作为用户，我希望长对话不会丢失早期上下文，以便继续深入讨论 | P0 |
| US-61 | 作为用户，我能在 Preferences 中开关摘要并调节触发/保留阈值 | P0 |
| US-62 | 作为用户，我能选择摘要使用的模型；不选时与 Chat 相同 | P1 |
| US-63 | 作为用户，清空聊天时 memory summary 一并清除 | P0 |
| US-64 | 作为用户，在 workflow 步骤中点击展开查看摘要详情 | P0 |

---

## 3. 背景

iter-06 的 `load_context` 加载 **全部** `messages` 送入 LLM。对话变长后：

- 逼近 model context window
- 延迟与成本上升
- 早期细节被截断且不可控

本迭代在 Workflow 中插入 **可观测** 的摘要链路，Preferences 提供用户级策略；**不**在对话区插入「Memory updated」类系统消息。

---

## 4. 术语

| 术语 | 定义 |
|------|------|
| **Turn（轮）** | 业内通用：**1 条 user message + 1 条 assistant message** 计为 1 轮；末尾仅 user 无 assistant 的未完成轮 **不计入** 轮数 |
| **Rolling summary** | 该对话一条累积摘要文本，多次触发时 **合并/更新** 同一条记录 |
| **Soft archive** | 已纳入摘要的消息在 DB **保留** 但 **不再** 送入 LLM；Clear chat 时硬删 |
| **Estimated tokens** | 服务端对 messages + summary 的 token 估算（技术设计定算法；须与 trigger/retain 一致） |

---

## 5. F-60 摘要策略

### 5.1 Preferences 参数（用户级 · English UI）

配置入口：[console/prd/profile-cn.md](../../console/prd/profile-cn.md) §3.4 iter-07。

| 参数 | UI 标签（English） | 类型 | 说明 |
|------|-------------------|------|------|
| Enable summarization | Enable conversation memory summarization | Toggle | 关则跳过 evaluate / summarize |
| Trigger turn count | Trigger when turns exceed | Number (int ≥ 1) | 完整轮数超过此值 **之一** 触发评估 |
| Retain turn count | Retain recent turns | Number (int ≥ 0) | 摘要后保留最近 N 轮完整消息 |
| Trigger token count | Trigger when estimated tokens exceed | Number (int ≥ 1) | 估算 token 超过此值 **之一** 触发评估 |
| Retain token count | Retain up to tokens | Number (int ≥ 1) | 保留窗口（recent messages + summary）目标上限 |
| Summary model | Summary model | Dropdown (optional) | 同 Models 页 **Passed** 列表；默认 **Same as chat model** |

**校验（Save 时）：**

- `retain_turns ≤ trigger_turns`
- `retain_tokens ≤ trigger_tokens`
- 关闭 Toggle 时其余字段只读/灰显，Save 仍只更新 Toggle

### 5.2 系统预设默认值

指 **新用户首次打开 Preferences、或从未改过摘要设置时** 系统自动使用的数值（用户可随时修改并 Save）：

| 参数 | 预设值 | 说明 |
|------|--------|------|
| Enable summarization | **On** | 默认开启 |
| Trigger turn count | **20** | 约 20 轮完整对话后可能触发 |
| Retain turn count | **6** | 始终保留最近 6 轮原文 |
| Trigger token count | **8000** | 估算超 8k token 可能触发 |
| Retain token count | **4000** | 压缩后上下文目标约 4k token |
| Summary model | **Same as chat model** | 未单独选择摘要模型 |

### 5.3 触发与保留（混合 · 产品已决）

**评估时机（方案 B · 已决）：** `evaluate_summarization` 与 `summarize_history` 均在 **`llm_stream` 结束且 assistant 消息已落库之后** 执行。评估输入含 **本轮完整 user+assistant 对**。

**触发（OR）：** 当 Enable = On，且 **任一** 满足即进入 `summarize_history` 执行路径：

```
complete_turns > trigger_turns
OR estimated_context_tokens > trigger_tokens
```

其中 `estimated_context_tokens` = 当前 rolling summary（若有）+ 全部未归档 messages（**含刚落库的 assistant**）。

**LLM 输入（`llm_stream` 阶段 · 在 evaluate/summarize 之前）：**

| 状态 | Chat LLM 实际读取 |
|------|-------------------|
| **尚无 rolling summary** | 全部未归档 messages（含当前 user；assistant 流式生成中尚未落库） |
| **已有 rolling summary** | rolling summary（注入 system）+ 未归档 recent messages |

> **说明：** 第一次超阈值那一轮，回复仍基于「尚无 summary 的完整未归档历史」；**摘要在本轮答完后执行**，从 **下一轮起** 才使用压缩后的 summary + retain 窗口。已有 summary 后的日常轮次，Chat 始终读 summary + recent，**不会** 把已归档旧消息逐条再送 LLM。

**保留（AND）：**

1. 始终保留最近 `retain_turns` 轮 **完整** user+assistant（含本轮），不参与本次归档  
2. 更早未归档消息合并进 rolling summary  
3. 摘要完成后，**后续** LLM 上下文 = `[system_prompt + rolling_summary]` + `[recent_messages]`，估算总量趋近 `retain_tokens`（容差见技术设计）

**Skip：** 未达触发阈值 → `summarize_history` emit success + summary `Skipped`（English）。

### 5.3.1 整轮原子性（Turn atomicity · 产品已决）

**无论触发原因是轮数还是 token，归档与保留的最小单位均为「完整轮」（1 user + 1 assistant）。** 禁止在单轮内部按 token 截断或只归档 user/assistant 之一。

| 规则 | 说明 |
|------|------|
| **归档批次** | 仅由 **完整的** 历史轮次组成；从 **最旧** 的完整轮开始，整轮并入 rolling summary 并 soft-archive |
| **保留窗口** | 最近 `retain_turns` 个 **完整轮**（含本轮刚落库的 user+assistant），整轮保留原文 |
| **token 触发** | 只决定 **是否** 执行 summarize；**不** 在单条 message  mid-turn 切分 |
| **retain_tokens** | 在已保留 `retain_turns` 完整轮之后，若估算仍高于 `retain_tokens`，**从保留窗口最旧的一整轮开始** 逐轮移入归档（仍保持整轮），直至低于目标或仅剩 1 轮可保留 |
| **边界轮** | 处于 retain / archive 分界上的那一轮，**整轮** 只归属一侧：要么全保留，要么全归档，不拆分 |

**示例（token 触发 · retain_turns=6）：**

- 估算超 `trigger_tokens`，但完整轮仅 8 轮 → 仍执行 summarize  
- 保留最近 6 个 **完整轮**（12 条 message）  
- 更早的 2 个 **完整轮** 整轮写入 summary 并归档  
- 若 6 轮原文 + summary 仍超 `retain_tokens`，从最旧的第 1 保留轮开始 **整轮** 移出保留区并并入本次归档，而非截断该轮 assistant 的一半文本  

**evaluate 统计 token：** 可按 message 粒度 **估算总量** 用于与 `trigger_tokens` / `retain_tokens` 比较；**执行 summarize 时** 的 archive/retain 决策仍按 **整轮** 对齐。

### 5.4 摘要 LLM

| 规则 | 说明 |
|------|------|
| 模型选择 | Preferences **Summary model**；选项含 `Same as chat model` + Passed 用户配置 |
| 兜底 | 未配置或选 Same as chat → 使用本轮 `resolve_model` 已解析的 chat 模型 |
| 独立配置 | 用户可选更便宜/更快的 Passed 模型专用于摘要 |
| 失败 | Chat 回复 **已交付且保留**；`summarize_history` emit `error`；**不** 回滚 assistant 消息；下一步仍用未压缩 context 直至摘要成功 |

### 5.5 Soft archive

| 项 | 规则 |
|----|------|
| 归档范围 | 已合并进 rolling summary 的消息 |
| DB | 保留行；增加 `summarized_at` 或等价标记（技术设计定） |
| LLM | `load_context` / 组装上下文时 **排除** 已归档消息 |
| UI 聊天区 | **不** 隐藏已归档消息（用户仍可见完整聊天历史） |
| Clear chat | 删除 messages **及** rolling summary **及** 归档标记（见 F-63） |

> **产品说明：** 软归档 = 「LLM 不用、DB 还在、聊天列表仍显示」；仅 Clear chat / 删对话时物理删除。

### 5.6 Rolling summary 内容要求

- English 输出（与平台 UI locale 一致；摘要内容面向 LLM，用 English 结构化要点）
- 保留：用户目标、已做决策、关键事实、未决问题、专有名词
- **禁止** 写入 API Key、token、密码等敏感信息
- 合并旧 summary + 新归档消息生成更新版（非仅追加一句）

---

## 6. F-61 Workflow Nodes（方案 B）

**流水线顺序（固定）：**

```
validate_request → load_context → load_history_summary → resolve_model → llm_stream
→ evaluate_summarization → summarize_history
```

| Node ID | 时机 | Label (English) | 职责 |
|---------|------|-----------------|------|
| `load_history_summary` | LLM **前** | Loading memory summary | 读 DB rolling summary；供 **本轮** Chat LLM 注入 system |
| `resolve_model` | LLM **前** | Resolving model | iter-06 不变 |
| `llm_stream` | — | Generating response | 用 **已有 summary + 未归档 messages** 流式回复并落库 assistant |
| `evaluate_summarization` | LLM **后** | Evaluating context size | 基于 **含新 assistant 的** messages 算 turns/tokens；**不调用 LLM** |
| `summarize_history` | LLM **后** | Summarizing history | 超阈值则 `generateText`、更新 summary、soft-archive；否则 `Skipped` |

**原则：**

- `load_history_summary` 与 `summarize_history` **独立 Node**（加载 vs 执行分离）  
- `evaluate` / `summarize` **均在 assistant 落库后**，归档范围 **当场重算**（含本轮完整对）  
- Enable = Off → evaluate `Summarization disabled`；summarize `Skipped`（仍可在 LLM 后快速 no-op）  
- 步骤 SSE：**先** 出现 Generate response（流式），**后** 出现 Evaluating / Summarizing（English）  
- 步骤 `summary` 可含较长文本（前端折叠展示）

---

## 7. F-62 步骤 UI — inline 折叠展开（P0）

沿用 iter-06 `WorkflowStepSummary` 模式，**不** 采用 Modal / Drawer 作为默认。

| 状态 | 行为 |
|------|------|
| 折叠（默认 · completed turn） | 步骤 label + 一行 truncated preview（≤ 80 字符） |
| 展开 | 点击步骤行切换；展示完整 `summary` + 元数据（如 `Summarized 8 turns · ~3.1k tokens`） |
| 长文本 | `max-h-48 overflow-y-auto` |
| `running` | active turn：**Generate response** 流式时 running；**LLM 结束后** Evaluating / Summarizing 依次 running |

**不做的 UI：**

- 对话区「Memory updated」系统气泡
- 默认 Modal / Drawer（摘要版本历史若做 follow-up 可考虑 Drawer）

---

## 8. F-63 Clear chat 扩展

扩展 [mvp-chat/prd/chat-experience-cn.md](../../mvp-chat/prd/chat-experience-cn.md) F-14：

| 项 | iter-07 增量 |
|----|-------------|
| 数据 | 除 `messages` 外，删除该对话 `conversation_memory_summaries`（表名技术设计定）及归档状态 |
| 确认文案（English） | 「Clear chat history? All messages **and conversation memory** will be removed. This cannot be undone.» |
| 标题 | 仍为 `New Chat` |

删对话（F-12）时级联删除 summary（若尚未有 FK cascade，本迭代补齐）。

---

## 9. 验收标准

- [x] **AC-70** — Preferences 可配置摘要 5 项 + Summary model；Save 持久化；非法组合拒绝并 inline 错误（English）
- [x] **AC-71** — Enable Off 时 evaluate/summarize 跳过，聊天行为与 iter-06 等价
- [x] **AC-72** — 超阈值：assistant 落库后 summarize 执行；summary 落库；**下一轮起** 已归档消息不进 LLM；第一次触发轮允许用「尚无 summary 的未归档全文」作答  
- [x] **AC-73** — 未超阈值：LLM 后 evaluate + summarize 显示 `Skipped`  
- [x] **AC-74** — Clear chat 清除 messages + memory summary；确认文案含 memory
- [x] **AC-75** — 步骤时间线点击展开摘要详情（English）；折叠态有 preview
- [x] **AC-76** — Summary model 未配置时使用 chat 模型；配置后使用所选 Passed 模型
- [x] **AC-77** — iter-05/06 回归：模型选择、流式、resume、步骤时间线基线通过

---

## 10. 非目标（iter-07）

- 按助理不同摘要策略  
- 摘要多版本历史浏览（Drawer）  
- 对话区展示摘要为独立 message  
- RAG / MCP  
- 自动删除 DB 中已归档 messages（须 Clear chat 或删对话）

---

## 11. 依赖

- iter-06 — WorkflowRunner、步骤 UI、DB 日志  
- iter-05 — Passed 模型配置、Preferences 双 Card  
- iter-02 — Clear chat API  

---

## 12. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-25 | iter-07 初稿 — 用户确认：软归档、轮次定义、可配置摘要模型、inline 折叠、iter-07 |
| 2026-06-25 | **方案 B** — evaluate + summarize 置于 `llm_stream` 之后；明确首次触发 vs 已有 summary 的 LLM 输入 |
| 2026-06-25 | **整轮原子性** — token/轮数混合触发下，归档与保留均以完整轮为最小单位 |
