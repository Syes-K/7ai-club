# knowledge-base — 功能概览

> **English:** [README.md](./README.md)  
> **中文:** [README-cn.md](./README-cn.md)

> **Feature slug:** `knowledge-base`  
> **迭代:** [`iter-09`](../../iterations/iter-09/README-cn.md)（**已发布 · 2026-07-01**）  
> **路线图阶段:** 2 — 知识库

---

## 文档地图（Agent 入口）

**iter-09 已发布 — changelog 为验收与迭代索引：**

1. [01-product-requirements-cn.md](./01-product-requirements-cn.md) — 总纲 §2 全局约定  
2. [changelog/iter-09-cn.md](./changelog/iter-09-cn.md) — **iter-09 AC-90–100**  
3. 子 PRD（按需加载）：
   - [kb-management-cn.md](./prd/kb-management-cn.md)
   - [kb-ingestion-cn.md](./prd/kb-ingestion-cn.md)
   - [kb-recall-test-cn.md](./prd/kb-recall-test-cn.md)
   - [rag-preferences-cn.md](./prd/rag-preferences-cn.md)（修订 console/profile）
   - [assistant-kb-binding-cn.md](./prd/assistant-kb-binding-cn.md)（修订 console/assistants）
   - [chat-rag-nodes-cn.md](./prd/chat-rag-nodes-cn.md)（修订 agent-orchestration）

| 层级 | 总纲 | 子文档 |
|------|------|--------|
| 产品 | [01-product-requirements-cn.md](./01-product-requirements-cn.md) | [prd/](./prd/) |
| 技术 | [02-technical-design-cn.md](./02-technical-design-cn.md) | [design/](./design/) |

**关联 feature：** [console](../console/README-cn.md) · [agent-orchestration](../agent-orchestration/README-cn.md)

---

## iter-09 范围摘要

- **Console** — `/console/knowledge` 列表 CRUD；单 source（文本 **或** 文件）；名称 + 说明  
- **入库** — 上传后异步 job：`doc-to-md-rag`（pdf/docx）→ 混合分片（结构边界 + token 窗口 + env overlap）→ embedding → pgvector  
- **召回测试** — ready 状态 KB 可测 query  
- **Preferences** — confidence（默认 **0.65**）、TopK（默认 **3**）、embedding 模型（Platform default + Passed embedding；**KB 创建时锁定**）  
- **Assistants** — 多选挂载 KB  
- **Chat** — 挂载 KB 时插入 `rag_query_optimize` → `rag_retrieve` workflow 节点  

---

*分层说明:* [docs/README-cn.md](../../README-cn.md)
