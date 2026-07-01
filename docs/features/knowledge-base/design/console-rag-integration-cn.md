# Console — RAG Preferences 与 Assistants 绑定

> **English:** [console-rag-integration.md](./console-rag-integration.md)  
> **中文：** [console-rag-integration-cn.md](./console-rag-integration-cn.md)  
> **总纲：** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **PRD：** [prd/rag-preferences-cn.md](../prd/rag-preferences-cn.md) · [prd/assistant-kb-binding-cn.md](../prd/assistant-kb-binding-cn.md)  
> **迭代：** iter-09

---

## 1. 设计目标

- Profile Preferences 增加 RAG 三字段 + embedding 变更确认
- Assistants 表单多选 Ready KB + RPC 持久化

---

## 2. Profile / Preferences

### 2.1 数据

- DB 列见 [kb-schema-cn.md](./kb-schema-cn.md) §2.5
- `lib/console/profile.ts` — `getUserProfile` select 扩展
- `lib/data/browser/profile.ts` — update RAG fields
- `lib/validation/profile.ts` — zod: threshold 0–1, topK 1–50

### 2.2 UI `preferences-card.tsx`

在 **Conversation memory** 区块下方新增 **RAG retrieval** 区块（同 Card，独立 Save）：

| 字段 | Edit 控件 |
|------|-----------|
| Confidence threshold | `<input type="number" step="0.05" min="0.05" max="1">` |
| Top K | `<input type="number" min="1" max="50">` |
| Embedding model | `<select>` — 选项来自 `lib/rag/embedding-models.ts` 常量白名单 |

**View 模式：**

```
RAG retrieval
Confidence threshold: 0.75
Top K: 5
Embedding model: SiliconFlow — BAAI/bge-m3
```

### 2.3 Embedding 变更确认

```typescript
const EMBEDDING_CHANGE_MESSAGE =
  "Changing the embedding model affects new knowledge bases only. Existing knowledge bases keep their original model and remain searchable. To use a new embedding model with existing content, create a new knowledge base after saving. Retry ingestion does not change an existing knowledge base's embedding model.";

// Save 前：if (embeddingChanged) show ConfirmDialog → onConfirm save
```

### 2.4 `lib/rag/embedding-models.ts`

```typescript
export const EMBEDDING_MODEL_OPTIONS = [
  {
    provider: "siliconflow",
    model: "BAAI/bge-m3",
    label: "SiliconFlow — BAAI/bge-m3",
    dimensions: 1024,
  },
  // 后续扩展须与 RAG_EMBEDDING_DIMENSIONS (1024) 一致
] as const;

export function getDefaultEmbeddingConfig() {
  return {
    provider: process.env.RAG_EMBEDDING_PROVIDER ?? "siliconflow",
    model: process.env.RAG_EMBEDDING_MODEL ?? "BAAI/bge-m3",
    dimensions: Number(process.env.RAG_EMBEDDING_DIMENSIONS ?? "1024"),
  };
}
```

---

## 3. Assistants KB 绑定

### 3.1 数据加载

`lib/data/browser/assistants.ts`：

- `listAssistants` — 不变
- `getAssistantWithKnowledgeBases(id)` — join 绑定 kb ids
- `listReadyKnowledgeBases()` — 供 multi-select 选项

### 3.2 保存

**方案：** RPC `set_assistant_knowledge_bases(p_assistant_id, p_kb_ids uuid[])`

Assistants 表单 Save 流程：

1. Upsert assistant 字段（现有）
2. `supabase.rpc("set_assistant_knowledge_bases", { p_assistant_id, p_kb_ids })`

### 3.3 UI `assistants-manager.tsx`

编辑/创建 dialog 增加：

```tsx
<fieldset>
  <legend>Knowledge bases</legend>
  {readyKbs.length === 0 ? (
    <p className="text-muted-foreground text-sm">
      No ready knowledge bases. Create one in Knowledge Base.
    </p>
  ) : (
    readyKbs.map((kb) => (
      <label key={kb.id}>
        <input type="checkbox" checked={selectedKbIds.includes(kb.id)} ... />
        {kb.name}
      </label>
    ))
  )}
</fieldset>
```

- 打开 dialog 时加载 `listReadyKnowledgeBases()`
- 编辑时预填已绑定 ids

---

## 4. 修改文件清单

| 路径 | 变更 |
|------|------|
| `components/console/preferences-card.tsx` | RAG 区块 |
| `components/console/assistants-manager.tsx` | KB checkboxes |
| `lib/console/profile.ts` | select RAG columns |
| `lib/data/browser/profile.ts` | update |
| `lib/data/browser/assistants.ts` | bindings RPC |
| `lib/validation/profile.ts` | RAG schema |
| `lib/rag/embedding-models.ts` | 新建 |

---

## 12. PRD 验收映射

| AC ID | 实现要点 | 验证方式 |
|-------|----------|----------|
| AC-94 | Preferences 三字段 + 确认对话框 | e2e + manual |
| AC-95 | multi-select + RPC | e2e |
| AC-99 | 绑定后 KB delete 409 | e2e |

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-30 | 初稿 |
| 2026-06-30 | 默认 SiliconFlow BAAI/bge-m3 |
