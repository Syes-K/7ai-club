# 召回测试

> **English:** [kb-recall-test.md](./kb-recall-test.md)  
> **中文：** [kb-recall-test-cn.md](./kb-recall-test-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **迭代：** iter-09

---

## 1. 范围

F-92 — KB 详情页内 **召回测试**：用户对 `ready` 状态的 KB 输入测试 query，查看向量检索结果。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-96 | 作为用户，我想在发布到 Chat 前测试召回效果，以便验证知识库质量 | P0 |

---

## 3. F-92 召回测试

### 3.1 入口

- KB 详情页（`/console/knowledge/[id]`）内 **Recall test** 区块
- 仅 `status = ready` 可用；`processing` / `error` 时 disabled + muted 说明

### 3.2 交互

| 控件 | 说明 |
|------|------|
| Query 输入 | 单行或多行；placeholder 如 *Enter a test query…* |
| **Run recall test** | 提交后页面 busy 或按钮 loading |
| 结果列表 | 按 **相似度降序**；最多 **TopK** 条（读用户 Preferences，默认 5） |

### 3.3 结果展示（每条）

| 字段 | 说明 |
|------|------|
| **Score** | 相似度 / 置信度（0–1，保留 2–3 位小数） |
| **Content** | chunk 文本（可截断；展开查看全文） |
| **Location** | 来源位置（heading path 或 line range — 来自 chunk 元数据） |
| 过滤 | 低于 Preferences **confidence threshold**（默认 0.75）的 hit **不展示**；若全部低于阈值，空态 *No results above the confidence threshold.* |

### 3.4 检索参数来源

| 参数 | 来源 |
|------|------|
| TopK | 用户 Preferences（默认 5） |
| Confidence threshold | 用户 Preferences（默认 0.75） |
| Embedding 模型 | **该 KB 创建时锁定的模型**（非 Preferences 新值） |

### 3.5 与 Chat 一致性

召回测试使用的检索逻辑（向量搜索 + threshold + TopK）须与 Chat `rag_retrieve` 节点 **同一实现**（不同入口，共享 lib）。

---

## 4. 验收标准

- [ ] **AC-93** — ready KB 可运行召回测试并展示 score、content、location  
- [ ] **AC-94** — Preferences 中 TopK / confidence 变更后测试行为随之变化  

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-30 | iter-09 初稿 |
