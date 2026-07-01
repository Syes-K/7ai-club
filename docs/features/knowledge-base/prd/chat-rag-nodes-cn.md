# Chat — RAG Workflow 节点

> **English:** [chat-rag-nodes.md](./chat-rag-nodes.md)  
> **中文：** [chat-rag-nodes-cn.md](./chat-rag-nodes-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **修订：** [agent-orchestration](../../agent-orchestration/README-cn.md)  
> **迭代：** iter-09

---

## 1. 范围

F-95 — 当助理挂载 ≥1 KB 时，Chat `/api/chat` Workflow 在 **LLM 生成前** 插入两个节点：

1. **`rag_query_optimize`** — 输入内容 RAG 召回优化  
2. **`rag_retrieve`** — 向量召回  

复用 iter-08 Workflow Registry 与步骤 UI（折叠面板、inline 展开 detail）。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-101 | 作为用户，我想看到系统如何优化我的问题以便检索，以便理解 RAG 行为 | P0 |
| US-102 | 作为用户，我想看到召回了哪些片段及置信度，以便验证回答依据 | P0 |

---

## 3. F-95 RAG Workflow 节点

### 3.1 插入条件

| 条件 | 行为 |
|------|------|
| 助理绑定 ≥1 ready KB | 插入 `rag_query_optimize` → `rag_retrieve` |
| 助理无 KB 或 KB 均未 ready | **跳过** 两节点（不显示 skipped 占位 — 与 iter-07 摘要 skipped 策略一致：未注册即不运行） |
| 节点顺序 | 在 `resolve_model` 之后、`reasoning` / `llm_stream` 之前（技术设计微调 order） |

### 3.2 Node：`rag_query_optimize`

| 项 | 说明 |
|----|------|
| Label（English） | *Optimizing query for retrieval* |
| 行为 | 调用 **Chat LLM**（非 embedding 模型），将用户本轮输入改写为更适合向量检索的 query；**仅用于召回**，不改变用户可见的原始消息 |
| 输入 | 用户本轮 `userText` + 可选最近 1–2 轮上下文（技术设计定是否含） |
| 输出 | 优化后 query 字符串；写入 step `detail` |
| UI | 折叠步骤行；可 inline 展开查看 **Optimized query**（muted Markdown 或 `<pre>`） |
| 失败 | step `error`；可降级为原始 userText 继续 retrieve（技术设计定 fallback） |

### 3.3 Node：`rag_retrieve`

| 项 | 说明 |
|----|------|
| Label（English） | *Retrieving knowledge* |
| 行为 | 用优化后 query（或 fallback 原文）对每个绑定 KB 的 **锁定 embedding 模型** 做向量搜索；合并结果按 score 排序；应用 Preferences **confidence** 与 **TopK** |
| 多 KB | 跨 KB 统一 TopK（非每 KB TopK — 除非技术设计另有说明） |
| 输出 | 命中 chunk 列表 + 注入 LLM 的 context 文本；写入 step `detail`（结构化 JSON 或 Markdown 表格 — 技术设计定） |
| UI 展开 detail | 每条：**Score**、**KB name**、**Content** 摘要、**Location** |
| 无命中 | step `success` + summary *No knowledge matched.*；LLM 不注入 KB context（或注入空 — 技术设计定） |
| 失败 | step `error`；Chat 可继续无 RAG 上下文生成（降级 — 技术设计定） |

### 3.4 LLM 上下文注入

- `rag_retrieve` 成功后，将 TopK 命中 chunk 格式化为 system 或 user 前缀 context（技术设计定模板）  
- **AC-98：** 助理回复应能引用 KB 中事实性内容  

### 3.5 三态展示

与 iter-08 一致：

- **对话中** — SSE 实时步骤  
- **刷新** — workflow restore + Redis resume 不受影响  
- **历史** — 从 `workflow_step_logs` 恢复；detail 可展开  

### 3.6 Node catalog 扩展

| nodeId | order（草案） | kind |
|--------|---------------|------|
| `rag_query_optimize` | 42 | `default` |
| `rag_retrieve` | 43 | `default` |

（位于 `resolve_model` 40 与 `reasoning` 45 之间。）

---

## 4. 验收标准

- [ ] **AC-96** — 挂载 KB 的助理：Query optimization 步骤可展开优化后 query  
- [ ] **AC-97** — RAG retrieval 步骤展示 score、content、location、KB name  
- [ ] **AC-98** — 回复体现 KB 内容  
- [ ] **AC-100** — 无 KB 助理 workflow 与 iter-08 一致  

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-30 | iter-09 初稿 — 修订 agent-orchestration |
