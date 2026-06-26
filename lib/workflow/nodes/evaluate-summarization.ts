import { evaluateSummarization } from "@/lib/memory/evaluate";
import { filterActiveDbMessages } from "@/lib/memory/assemble-llm-messages";
import {
  profileToSummarizationPrefs,
} from "@/lib/memory/resolve-summary-model";
import { formatTokenCount } from "@/lib/memory/token-estimate";
import type { WorkflowNode } from "@/lib/workflow/types";

export const evaluateSummarizationNode: WorkflowNode = {
  id: "evaluate_summarization",
  label: "Evaluating context size",
  async run(ctx) {
    if (!ctx.dbMessages) {
      throw new Error("Conversation messages not loaded");
    }

    const prefs = profileToSummarizationPrefs(ctx.profile);
    const activeMessages = filterActiveDbMessages(ctx.dbMessages);

    ctx.summarizationPlan = evaluateSummarization({
      prefs,
      summary: ctx.memorySummary ?? null,
      activeMessages,
    });

    if (!prefs.summarization_enabled) {
      return "Summarization disabled";
    }

    const { completeTurns, estimatedTokens } = ctx.summarizationPlan.stats;
    return `${completeTurns} turns · ~${formatTokenCount(estimatedTokens)} tokens`;
  },
};
