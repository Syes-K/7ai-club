# PRD：Intent-First RAG（v0.1.1）

## 1. 背景与目标

### 1.1 背景
当前问答链路缺少稳定的“意图优先”路由机制，导致知识库问题未被可靠送入检索分支，且检索与直答边界不清晰。

### 1.2 目标（已确认）
本期目标为在单轮请求内完成意图优先路由，并落实以下产品决策：
1. 意图识别采用 `confidence` 阈值，且阈值可配置。
2. `topN` 与 `score` 均支持全局配置，其中 `topN` 默认值为 `3`。
3. “命中但检索为空”不提示用户，直接进入下一 node（大模型直答）。
4. “意图配置”使用单独页面，该页面仅用于配置后续节点路由。
5. 若后续节点包含“知识库搜索”，必须指定知识库条目，且支持多选。
6. 所有 node 统一结构为 `input`、`output`、`nextNodes`，其中 `nextNodes` 可为空。
7. `nextNodes` 结构上允许未来扩展编排；当前阶段仍采用线性默认流。

### 1.3 成功指标（首版）
- 意图命中后检索链路可用率 >= 99%；
- 命中意图请求的检索上下文组装成功率 >= 99%；
- 未命中与空检索场景可稳定进入大模型直答（回退成功率 >= 99.9%）；
- 单次请求端到端 P95 延迟：
  - 未命中或空检索：<= 2.5s；
  - 命中且有检索结果：<= 3.5s（不含上游模型服务抖动）。

## 2. 范围定义

### 2.1 In Scope（本期做）
1. 单轮请求的意图优先路由（一步完成）。
2. 意图识别前置，并基于 `confidence` 阈值决定是否命中。
3. 命中后执行知识库检索，检索参数由全局配置中心提供（`topN`、`score`）。
4. 未命中或命中但检索为空时，均进入大模型直答 node。
5. 提供“意图配置”独立页面（仅配置路由规则，不承载检索/模型参数管理）。
6. 服务端 node 化编排（意图识别、知识库搜索、模型请求、最终响应）。

### 2.2 Out of Scope（本期不做）
1. 多轮对话记忆与跨轮意图修正。
2. 检索结果重排（rerank）与多路召回。
3. 自动学习/自动生成意图配置。
4. skills/tools/mcp 的业务执行（仅预留扩展点）。
5. 管理端复杂权限体系与高级审计页面。

## 3. 关键用户故事

### 用户故事 1：独立意图配置
作为 知识库运营人员  
我想要 在独立“意图配置”页面维护知识库条目与意图映射  
以便 控制后续节点的路由行为

验收标准：
- [ ] 系统提供独立页面用于意图配置，入口与知识库内容编辑解耦。
- [ ] 页面仅负责路由配置（意图、启停、匹配阈值关联），不承载检索参数与模型参数编辑。
- [ ] 配置变更可被意图识别 node 实时或准实时读取。

### 用户故事 2：命中后检索增强
作为 提问用户  
我想要 在问题命中意图时获得检索增强回答  
以便 提升答案相关性

验收标准：
- [ ] 命中判定基于 `confidence >= confidenceThreshold`。
- [ ] 检索参数使用全局配置：`topN`（默认 `3`）与 `scoreThreshold`（可配置）。
- [ ] 检索结果按分值过滤并截断后组装进模型上下文。

### 用户故事 3：空检索无感回退
作为 提问用户  
我想要 在命中但无检索结果时仍获得自然回答  
以便 避免流程提示打断体验

验收标准：
- [ ] 命中但检索为空时，系统不向用户展示“未检索到内容”等提示。
- [ ] 链路直接进入下一 node（大模型直答）并保持统一响应格式。
- [ ] 内部日志记录回退原因为 `empty_retrieval` 以便监控。

## 4. 详细功能需求

### 4.1 意图识别与命中判定
1. 所有请求先进入 `intent_recognition_node`。
2. 识别输出至少包含：`is_intent_hit`、`matched_intent_id`、`confidence`。
3. 命中规则：
   - 当 `confidence >= confidenceThreshold` 且存在有效匹配意图时判定命中；
   - 否则判定未命中并直达模型请求 node。
4. `confidenceThreshold` 必须可配置（全局配置），支持后续按环境差异化。

### 4.2 检索配置与执行
1. 命中后进入 `knowledge_search_node`。
2. 检索参数来自全局配置中心：
   - `topN`：默认值 `3`；
   - `scoreThreshold`：可配置，默认值采用占位策略（见 4.5）。
3. 检索结果需包含：`chunk_id`、`content`、`score`、`kb_entry_id`。
4. 过滤后若结果为空，进入空检索回退分支。

### 4.3 回退策略（覆盖冲突定义）
1. 未命中：直接进入 `model_request_node`。
2. 命中但检索为空：不提示用户，直接进入 `model_request_node`。
3. 检索异常：记录异常并进入 `model_request_node`。
4. 模型请求失败：`final_response_node` 返回统一错误结构与可重试提示。

### 4.4 意图配置页面要求
1. 必须提供单独页面用于意图配置。
2. 页面职责仅限“后续节点路由配置”，包括意图映射与启停管理。
3. 页面不承载检索阈值、模型参数等非路由配置（统一在全局配置中心管理）。
4. 若某 node 的后续节点包含 `knowledge_search_node`，则必须指定至少一个知识库条目后方可保存。
5. 知识库条目字段支持多选（`selectedKnowledgeBaseEntryIds: string[]`）。

### 4.6 Node 统一结构与路由扩展约束
1. 所有 node 统一采用 `NodeSchema`：
   - `id: string`
   - `type: string`
   - `input: Record<string, unknown>`
   - `output: Record<string, unknown>`
   - `nextNodes: string[]`（允许为空）
2. `nextNodes` 用于描述后续编排关系；本期默认线性流为：
   - `intent_recognition_node -> knowledge_search_node -> model_request_node -> final_response_node`
3. 为保证未来扩展，结构层面允许 `nextNodes` 指向多个候选后续节点；但本期执行策略仍按线性默认流落地。
4. 知识库搜索 node 配置采用 `KnowledgeSearchNodeConfig`，核心字段为 `selectedKnowledgeBaseEntryIds: string[]`。
5. 当某 node 的 `nextNodes` 包含 `knowledge_search_node` 时，`selectedKnowledgeBaseEntryIds` 必须非空。

### 4.5 默认配置建议（占位策略）
1. `confidenceThreshold` 默认建议值：`0.70`（作为首发基线，可通过灰度数据回调）。
2. `topN` 默认值：`3`（已确认）。
3. `scoreThreshold` 默认值：先采用占位默认 `0.50`，并在设计阶段确认是否保留或调整。
4. 所有默认值需在配置中心可视化展示并支持热更新/发布流程约束。

## 5. 非功能需求

### 5.1 可扩展性
- node 接口契约稳定，支持新增 `skills_node`、`tools_node`、`mcp_node`。
- 编排层支持按配置控制节点启用顺序，不改动既有 node 输入输出。

### 5.2 可观测性
- 每次请求生成 `trace_id`。
- 至少记录：命中状态、`confidence`、阈值、检索返回数、回退原因、各 node 耗时。
- 输出指标：命中率、空检索率、回退率、延迟分位数。

### 5.3 用户体验一致性
- 未命中与空检索两种回退均不弹出额外用户提示。
- 对外响应结构保持一致，避免调用方分支处理。

## 6. 验收标准（Given/When/Then）

1. 基于 confidence 的命中判定
- Given 已配置并启用意图 A，且全局 `confidenceThreshold=0.70`
- When 用户 query 的识别结果为 A 且 `confidence=0.74`
- Then 系统判定命中并进入知识库搜索 node

2. topN 与 score 全局配置生效
- Given 全局配置 `topN=3`、`scoreThreshold=0.50`
- When 命中意图后执行检索
- Then 系统仅保留 `score >= 0.50` 的结果并最多返回 3 条

3. 未命中直答
- Given query 未命中任一启用意图或 `confidence < confidenceThreshold`
- When 意图识别完成
- Then 系统跳过知识库搜索并进入模型请求 node

4. 命中但检索为空无感回退
- Given query 命中意图
- When 检索过滤后结果为空
- Then 系统不向用户提示空检索信息，直接进入模型请求 node

5. 意图配置独立页面边界
- Given 运营人员进入“意图配置”页面
- When 执行配置编辑
- Then 页面仅修改后续节点路由相关配置，不提供检索阈值与模型参数编辑能力

6. 后续节点包含知识库搜索但未选条目时保存失败
- Given 运营人员将某 node 的 `nextNodes` 设置为包含 `knowledge_search_node`
- When 未选择任何知识库条目（`selectedKnowledgeBaseEntryIds` 为空或缺失）并尝试保存
- Then 系统保存失败并给出明确错误：必须至少选择一个知识库条目

## 7. 风险与缓解
1. 默认 `confidenceThreshold` 偏高导致漏命中  
缓解：灰度监控命中率并支持快速调参。
2. `scoreThreshold` 占位值与实际知识库分布不匹配  
缓解：设计阶段明确确认口径，并在后端阶段补充分层配置策略。
3. 独立配置页与全局配置中心职责混淆  
缓解：在信息架构与权限边界中明确“路由配置”与“全局参数配置”分离。
