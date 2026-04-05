# 需求清单：Intent Routing 与检索回退（v0.1.1）

## 1. 需求摘要
本需求定义“意图优先”问答路由，先意图识别再决定检索/直答分支，并落实已确认决策：  
1) `confidence` 阈值命中且阈值可配置；  
2) `topN` 与 `score` 全局可配置（`topN` 默认 `3`）；  
3) 命中但检索为空不提示用户，直接进入大模型直答 node；  
4) “意图配置”为独立页面，且仅负责后续节点路由配置。

## 2. 功能需求（FR）

### FR-01 意图识别前置与阈值判定
- 所有请求必须先进入 `intent_recognition_node`。
- 输出至少包含：`is_intent_hit`、`matched_intent_id`、`confidence`。
- 命中规则为：`confidence >= confidenceThreshold` 且匹配到启用意图。
- `confidenceThreshold` 必须支持全局配置与运行时生效。
- 意图识别异常时按未命中处理并记录错误日志。

### FR-02 意图配置独立页面
- 必须提供“意图配置”独立页面。
- 页面仅用于配置后续节点路由（意图映射、启停、路由相关字段）。
- 页面不提供检索参数（`topN`、`scoreThreshold`）与模型参数编辑能力。
- 配置变更需可追踪（更新时间、操作者、变更内容）。

### FR-03 命中后检索参数化
- 当 `is_intent_hit=true` 时触发 `knowledge_search_node`。
- `topN` 与 `scoreThreshold` 从全局配置读取。
- `topN` 默认值固定为 `3`。
- 检索按 `score >= scoreThreshold` 过滤并按分值降序截断到 `topN`。
- 输出字段至少包含：`chunk_id`、`content`、`score`、`kb_entry_id`。

### FR-04 回退策略与用户可见行为
- 未命中意图：直接进入 `model_request_node`。
- 命中但检索为空：不向用户提示检索为空，直接进入 `model_request_node`。
- 检索异常：记录异常并进入 `model_request_node`。
- 模型失败：由 `final_response_node` 返回统一错误结构（含 `trace_id` 与可重试标记）。

### FR-05 Node 编排契约
- 本期固定 4 个 node：`intent_recognition_node`、`knowledge_search_node`、`model_request_node`、`final_response_node`。
- 各 node 使用统一上下文对象与错误语义。
- 预留扩展位：`skills_node`、`tools_node`、`mcp_node`。
- 所有 node 统一采用 `input`、`output`、`nextNodes` 三段结构，且 `nextNodes` 允许为空数组。
- 当前阶段默认线性流转为：`intent_recognition_node -> knowledge_search_node -> model_request_node -> final_response_node`。
- `nextNodes` 用于编排流转扩展，结构层面允许未来非线性路由，但本期运行时仍按线性默认流执行。

### FR-06 知识库搜索节点必选文档约束
- 当某 node 的 `nextNodes` 包含 `knowledge_search_node` 时，必须配置知识库文档。
- 知识库文档字段支持多选，至少选择 1 项后才可保存。
- 若未配置文档则配置保存失败，并返回明确错误信息给配置端。

## 2.1 数据结构约束

### NodeSchema
- `id: string`，node 唯一标识。
- `type: string`，node 类型（如 `intent_recognition_node`/`knowledge_search_node`）。
- `input: Record<string, unknown>`，node 输入载荷。
- `output: Record<string, unknown>`，node 输出载荷。
- `nextNodes: string[]`，后续 node 列表，可为空数组。

### KnowledgeSearchNodeConfig
- `selectedKnowledgeBaseEntryIds: string[]`，知识库文档 ID 列表，支持多选。
- 约束：当当前 node 或上游路由将流转到 `knowledge_search_node` 时，`selectedKnowledgeBaseEntryIds.length >= 1`。
- 约束违反时禁止保存，并返回字段级错误：`selectedKnowledgeBaseEntryIds is required when next node includes knowledge_search_node`。

## 3. 非功能需求（NFR）

### NFR-01 可配置性
- `confidenceThreshold`、`topN`、`scoreThreshold` 均由全局配置中心统一管理。
- 配置变更需支持灰度/发布流程约束，避免直接影响全量流量。

### NFR-02 可观测性
- 每次请求生成 `trace_id`。
- 必须记录：命中状态、`confidence`、生效阈值、检索返回条数、回退原因、各 node 耗时。
- 暴露指标：命中率、空检索率、回退率、端到端 P95。

### NFR-03 性能
- P95 目标：
  - 未命中或空检索回退：<= 2.5s；
  - 命中且检索增强：<= 3.5s。
- 检索与模型调用超时均需可配置。

### NFR-04 一致性与体验
- 空检索回退与未命中回退均不展示额外用户提示。
- 对外响应结构在不同分支保持一致。

## 4. 默认配置建议（含占位策略）
- `confidenceThreshold`：建议默认 `0.70`（首发基线，需后续灰度校准）。
- `topN`：默认 `3`（已确认）。
- `scoreThreshold`：默认值先采用占位 `0.50`，在设计阶段确认是否调整。
- 若设计阶段未完成确认，后端实现按占位值落地并在发布前设置显式确认检查项。

## 5. 验收标准（Given/When/Then）

### AC-01 confidence 阈值命中
- Given 已启用意图 A，且全局 `confidenceThreshold=0.70`
- When 用户 query 识别为 A 且 `confidence=0.74`
- Then 系统判定命中并进入 `knowledge_search_node`

### AC-02 confidence 阈值未命中
- Given 已启用意图 A，且全局 `confidenceThreshold=0.70`
- When 用户 query 的最高匹配 `confidence=0.63`
- Then 系统判定未命中并直接进入 `model_request_node`

### AC-03 topN 与 score 全局配置生效
- Given 全局配置 `topN=3`、`scoreThreshold=0.50`
- When 命中意图后返回 8 条候选结果
- Then 系统仅保留 `score >= 0.50` 的结果并最多输出 3 条

### AC-04 命中但检索为空无提示回退
- Given query 命中意图
- When 过滤后无有效检索结果
- Then 系统不向用户展示空检索提示，直接进入 `model_request_node`

### AC-05 意图配置页面边界
- Given 运营人员进入“意图配置”页面
- When 尝试配置参数
- Then 仅允许编辑路由相关配置，不允许编辑 `topN/scoreThreshold` 与模型参数

### AC-06 异常一致性
- Given `knowledge_search_node` 发生运行时异常
- When 请求进入异常处理
- Then 系统记录错误并进入直答分支，最终响应结构保持一致且包含 `trace_id`

### AC-07 知识库搜索节点缺失文档时保存失败
- Given 运营人员在意图配置中将某 node 的 `nextNodes` 配置为包含 `knowledge_search_node`
- When `selectedKnowledgeBaseEntryIds` 为空数组或未传
- Then 配置保存失败，并提示必须至少选择一个知识库文档

## 6. 依赖与假设
- 已具备向量检索能力与可用模型服务。
- 全局配置中心具备参数下发与版本管理能力。
- 意图配置页面与配置中心权限边界可在设计阶段明确。
