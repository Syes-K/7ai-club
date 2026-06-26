import { buildLlmUiMessages } from "@/lib/memory/assemble-llm-messages";
import { getMemorySummary } from "@/lib/memory/persistence";
import { formatTokenCount } from "@/lib/memory/token-estimate";
import type { WorkflowNode } from "@/lib/workflow/types";

export const loadHistorySummaryNode: WorkflowNode = {
  id: "load_history_summary",
  label: "Loading memory summary",
  async run(ctx) {
    ctx.memorySummary = await getMemorySummary(ctx.conversationId, ctx.supabase);

    if (ctx.dbMessages) {
      ctx.llmUiMessages = buildLlmUiMessages(ctx.dbMessages);
    }

    if (!ctx.memorySummary) {
      return "No prior summary";
    }

    return `Summary loaded (~${formatTokenCount(ctx.memorySummary.token_estimate)} tokens)`;
  },
};
