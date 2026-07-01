# Chat — RAG Workflow 节点

> **English:** [chat-rag-nodes.md](./chat-rag-nodes.md)  
> **中文：** [chat-rag-nodes-cn.md](./chat-rag-nodes-cn.md)  
> **总纲：** [02-technical-design-cn.md](../02-technical-design-cn.md)  
> **PRD：** [prd/chat-rag-nodes-cn.md](../prd/chat-rag-nodes-cn.md)  
> **迭代：** iter-09

---

## 1. 设计目标

- 助理绑定 ≥1 **ready** KB 时插入两节点
- Query optimize（`generateText`）+ retrieve（`lib/rag/retrieve.ts`）
- Step detail 复用 `DefaultStepRow` 展开
- RAG context 注入 `llm_stream` system prompt

---

## 2. Context 扩展

`lib/workflow/types.ts`：

```typescript
export type KnowledgeBaseBinding = {
  id: string;
  name: string;
  embeddingProvider: string;
  embeddingModel: string;
};

export type WorkflowContext = {
  // ...existing
  knowledgeBases?: KnowledgeBaseBinding[];
  ragOptimizedQuery?: string;
  ragHits?: RagHit[];
  ragContextText?: string;
};

export type ProfileRow = {
  // ...existing
  rag_confidence_threshold: number;
  rag_top_k: number;
};
```

---

## 3. 加载 KB 绑定

在 `loadContextNode` 或独立 helper `loadAssistantKnowledgeBases(assistantId, supabase)`：

```typescript
const { data } = await supabase
  .from("assistant_knowledge_bases")
  .select("kb_id, knowledge_bases!inner(id,name,status,embedding_provider,embedding_model)")
  .eq("assistant_id", assistantId);

ctx.knowledgeBases = data
  ?.filter((row) => row.knowledge_bases.status === "ready")
  .map(/* ... */);
```

`toProfileRow` 增加 RAG 三字段。

---

## 4. Node catalog

`lib/workflow/node-catalog.ts`：

```typescript
rag_query_optimize: { order: 42, kind: "default", label: "Optimizing query for retrieval" },
rag_retrieve: { order: 43, kind: "default", label: "Retrieving knowledge" },
```

更新 `WORKFLOW_NODE_ORDER` 常量。

---

## 5. `rag_query_optimize`

`lib/workflow/nodes/rag-query-optimize.ts`：

```typescript
export const ragQueryOptimizeNode: WorkflowNode = {
  id: "rag_query_optimize",
  label: "Optimizing query for retrieval",
  async run(ctx) {
    if (!ctx.knowledgeBases?.length) return; // 不应被注册
    try {
      const result = await generateText({
        model: getChatModelForResolvedConfig(ctx.resolved!),
        prompt: buildRagOptimizePrompt(ctx.userText),
        maxOutputTokens: 256,
        abortSignal: AbortSignal.timeout(getLlmTimeoutMs()),
      });
      ctx.ragOptimizedQuery = result.text.trim() || ctx.userText;
    } catch {
      ctx.ragOptimizedQuery = ctx.userText;
    }
    return ctx.ragOptimizedQuery;
  },
};
```

**Step detail（emit success 时）：**

```typescript
detail: `**Optimized query**\n\n${ctx.ragOptimizedQuery}`,
detailFormat: "markdown",
```

---

## 6. `rag_retrieve`

`lib/workflow/nodes/rag-retrieve.ts`：

```typescript
export const ragRetrieveNode: WorkflowNode = {
  id: "rag_retrieve",
  label: "Retrieving knowledge",
  async run(ctx) {
    const query = ctx.ragOptimizedQuery ?? ctx.userText;
    const profile = ctx.profile!;
    ctx.ragHits = await retrieveChunks({
      kbIds: ctx.knowledgeBases!.map((kb) => kb.id),
      query,
      threshold: profile.rag_confidence_threshold,
      topK: profile.rag_top_k,
      kbEmbeddingConfigs: ctx.knowledgeBases!,
    });
    ctx.ragContextText = formatRagContext(ctx.ragHits);
    return ctx.ragHits.length
      ? `${ctx.ragHits.length} chunk(s) matched`
      : "No knowledge matched";
  },
};
```

**`lib/rag/retrieve.ts` 多 KB 逻辑：**

1. 按 KB 分组 embedding config（同 model 可 batch embed query 一次）
2. 对每个 KB（或每组 model）调用 `match_knowledge_base_chunks` RPC
3. 合并 hits，按 score 降序，取 global topK
4. 附带 `kbName` 供 UI

**Step detail Markdown 示例：**

```markdown
| Score | KB | Location |
|-------|-----|----------|
| 0.85 | FAQ | ## Reset password |

**Excerpt:** User can reset via Settings...
```

---

## 7. Chat route 条件注册

`app/api/chat/route.ts`：

```typescript
function buildPreLlmNodes(ctx: WorkflowContext): WorkflowNode[] {
  const base = [
    validateRequestNode,
    loadContextNode,
    loadHistorySummaryNode,
    resolveModelNode,
  ];
  if (ctx.knowledgeBases?.length) {
    return [...base, ragQueryOptimizeNode, ragRetrieveNode];
  }
  return base;
}

// 问题：knowledgeBases 在 loadContext 后才知 — 两阶段 run
```

**实现模式（两阶段）：**

```typescript
await runWorkflow(
  [validateRequestNode, loadContextNode, loadHistorySummaryNode, resolveModelNode],
  ctx, emit,
);
const ragNodes = ctx.knowledgeBases?.length
  ? [ragQueryOptimizeNode, ragRetrieveNode]
  : [];
if (ragNodes.length) {
  await runWorkflow(ragNodes, ctx, emit);
}
await runLlmStreamNode(ctx, writer, emit);
```

无 KB 时不注册 → **无 skipped 行**（符合 PRD）。

---

## 8. LLM context 注入

`lib/workflow/nodes/llm-stream.ts` — `buildSystemPrompt`：

```typescript
function buildSystemPrompt(ctx: WorkflowContext): string {
  const parts = [ctx.assistant?.system_prompt ?? ""];
  if (ctx.memorySummary?.content?.trim()) {
    parts.push(`## Conversation memory\n${ctx.memorySummary.content.trim()}`);
  }
  if (ctx.ragContextText?.trim()) {
    parts.push(`## Retrieved knowledge\n${ctx.ragContextText.trim()}`);
  }
  return parts.filter(Boolean).join("\n\n");
}
```

`formatRagContext` 模板：

```
[Source: {kbName} | {headingPath}]
{content}
---
```

---

## 9. Chat UI

- **无需新 Registry renderer** — `kind: default` + `detail` markdown
- 长 detail 用 `SummaryDetailBlock` 折叠（iter-08 已有）
- 三态：SSE / refresh restore / history DB — 无新 event type

---

## 12. PRD 验收映射

| AC ID | 实现要点 | 验证方式 |
|-------|----------|----------|
| AC-96 | optimize node + detail markdown | e2e + manual |
| AC-97 | retrieve node + hits detail | e2e + manual |
| AC-98 | `buildSystemPrompt` RAG section | manual |
| AC-100 | 无 KB 时不 runWorkflow rag 段 | e2e 回归 |

---

## 13. 修订记录

| 日期 | 变更 |
|------|------|
| 2026-06-30 | 初稿 |
