# Assistants — 知识库绑定

> **English:** [assistant-kb-binding.md](./assistant-kb-binding.md)  
> **中文：** [assistant-kb-binding-cn.md](./assistant-kb-binding-cn.md)  
> **总纲：** [01-product-requirements-cn.md](../01-product-requirements-cn.md)  
> **修订：** [console/prd/assistants-cn.md](../../console/prd/assistants-cn.md)  
> **迭代：** iter-09

---

## 1. 范围

F-94 — `/console/assistants` 新增/编辑表单：助理可 **挂载 0–N 个** 知识库（多选）。

---

## 2. 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-99 | 作为用户，我希望为助理选择多个知识库，以便对话时检索不同资料 | P0 |
| US-100 | 作为用户，我只看到 Ready 状态的知识库，以免绑定未就绪的资料 | P1 |

---

## 3. F-94 Assistant ↔ KB 绑定

### 3.1 表单字段

| 字段 | 控件 | 说明 |
|------|------|------|
| Knowledge bases | Multi-select（checkbox group 或 combobox） | 选项：当前用户 **status = ready** 的 KB；显示 Name；按名称排序 |
| 空选项 | — | 可不选（0 个 KB） |
| 非 Ready KB | — | **不出现在选项中**（processing / error 不可绑） |

列表页 **不** 展示 KB 列（保持 iter-03 表格列）；仅在编辑表单配置。

### 3.2 持久化

- 多对多：`assistant_knowledge_bases (assistant_id, kb_id)`  
- Save 助理时 replace 绑定集合（技术设计定 upsert 策略）

### 3.3 Chat 行为

- 助理挂载 ≥1 KB → Chat workflow 插入 RAG 节点（见 [chat-rag-nodes-cn.md](./chat-rag-nodes-cn.md)）
- 挂载 0 KB → 与 iter-08 相同，**无** RAG 节点

### 3.4 删除保护（反向）

- KB 被任一助理绑定时，KB 删除返回 **409**（见 [kb-management-cn.md](./kb-management-cn.md)）
- 助理删除规则不变（仍有对话则 409）

---

## 4. 验收标准

- [ ] **AC-95** — 助理表单可多选 ready KB 并 Save  
- [ ] **AC-99** — 绑定中的 KB 不可删除  
- [ ] **AC-100** — 未绑定 KB 的助理 Chat workflow 无 RAG 节点  

---

## 5. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-30 | iter-09 初稿 — 修订 console/assistants |
