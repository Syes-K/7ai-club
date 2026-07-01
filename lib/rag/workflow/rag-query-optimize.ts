import { optimizeRagQuery } from "@/lib/rag/optimize-query";
import type { WorkflowNode } from "@/lib/workflow/types";

export const ragQueryOptimizeNode: WorkflowNode = {
  id: "rag_query_optimize",
  label: "Optimizing query for retrieval",
  async run(ctx) {
    if (!ctx.knowledgeBases?.length || !ctx.resolved) {
      return;
    }

    ctx.ragOptimizedQuery = await optimizeRagQuery(ctx.userText, ctx.resolved);

    return `Optimized query\n\n**Optimized query**\n\n${ctx.ragOptimizedQuery}`;
  },
};
