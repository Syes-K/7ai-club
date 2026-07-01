# Preferences — RAG 召回配置

> **English:** [rag-preferences.md](./rag-preferences.md)  
> **中文：** [rag-preferences-cn.md](./rag-preferences-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **修订：** [console/prd/profile-cn.md](../../console/prd/profile-cn.md)  
> **迭代：** iter-09

---

## 1. 范围

F-93 — `/console/profile` Preferences Card 新增 **RAG / Knowledge retrieval** 区块（English UI），与 Chat model、Conversation memory 同 Card 或独立 Card（技术设计定布局）；**独立 Save**。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-97 | 作为用户，我希望配置召回置信度和 TopK，以便控制 RAG 结果数量与质量 | P0 |
| US-98 | 作为用户，我希望选择 embedding 模型，以便新知识库使用合适的向量模型 | P0 |

---

## 3. F-93 RAG Preferences

### 3.1 字段（Edit 模式）

| 字段 | 控件 | 默认 | 校验 |
|------|------|------|------|
| Confidence threshold | Number input（0–1，步进 0.05） | **0.65**（代码 `lib/rag/defaults.ts`） | 0 < x ≤ 1 |
| Top K | Number input（整数） | **3** | 1 ≤ x ≤ 50（上限技术设计可调） |
| Embedding model | Dropdown | env 平台默认（**Platform default**，排第一） | 选项：**Platform default** + Models 页 **Passed · type=embedding** 的个人配置（见 [models-cn §3.10](../../console/prd/models-cn.md)） |

**View 模式（English 示例）：**

```
RAG retrieval
Confidence threshold: 0.65
Top K: 3
Embedding model: Platform default (SiliconFlow — BAAI/bge-m3)
```

### 3.2 Embedding 模型变更警告

用户 Save 且 **embedding model 相对上次保存值发生变化** 时：

- 显示确认对话框（English），例如：  
  *"Changing the embedding model affects new knowledge bases only. Existing knowledge bases keep their original model and remain searchable. To use a new embedding model with existing content, create a new knowledge base after saving. Retry ingestion does not change an existing knowledge base's embedding model."*
- 用户 **Confirm** 后才持久化；**Cancel** 恢复原值

（产品决策：KB **创建时锁定**模型；改 Preferences **不自动 re-embed** 旧 KB。）

### 3.3 作用范围

| 参数 | 影响 |
|------|------|
| Confidence / TopK | 召回测试；Chat `rag_retrieve` |
| Embedding model | **仅新建 KB** 的默认锁定模型；已有 KB 不变 |

### 3.4 默认值来源

未配置时：confidence **0.65**、TopK **3**（代码常量）；embedding 平台默认来自 env `RAG_EMBEDDING_PROVIDER` + `RAG_EMBEDDING_MODEL`（Profile 下拉首项 **Platform default**）。

---

## 4. 验收标准

- [ ] **AC-94** — Preferences 可编辑、Save、View 展示；默认值正确  
- [ ] **AC-94** — 变更 embedding model 时出现确认对话框  

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-30 | iter-09 初稿 — 修订 console/profile |
| 2026-06-30 | 默认值 0.65 / TopK 3；Embedding 下拉来源改为 Platform default + Passed embedding 配置 |
| 2026-07-01 | §3.2 确认框文案：Retry ingestion 不换 embedding；旧内容需新建 KB |
