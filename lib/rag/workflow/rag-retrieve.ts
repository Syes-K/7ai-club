import {
  formatRagContext,
  formatRagHitsDetail,
  retrieveChunks,
} from "@/lib/rag/retrieve";
import type { WorkflowNode } from "@/lib/workflow/types";

export const ragRetrieveNode: WorkflowNode = {
  id: "rag_retrieve",
  label: "Retrieving knowledge",
  async run(ctx) {
    if (!ctx.knowledgeBases?.length || !ctx.profile) {
      return;
    }

    const query = ctx.ragOptimizedQuery ?? ctx.userText;
    ctx.ragHits = await retrieveChunks({
      supabase: ctx.supabase,
      userId: ctx.userId,
      bindings: ctx.knowledgeBases,
      query,
      threshold: ctx.profile.rag_confidence_threshold,
      topK: ctx.profile.rag_top_k,
    });

    ctx.ragContextText = formatRagContext(ctx.ragHits);
    ctx.ragHitsDetail = formatRagHitsDetail(ctx.ragHits);

    return ctx.ragHits.length
      ? `${ctx.ragHits.length} chunk(s) matched\n\n${ctx.ragHitsDetail ?? ""}`
      : "No knowledge matched";
  },
};
