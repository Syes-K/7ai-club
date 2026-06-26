import type { DbMessageWithArchive } from "@/lib/data/types";
import type {
  ContextStats,
  MemorySummaryRow,
  SummarizationPlan,
  SummarizationPrefs,
} from "@/lib/memory/types";
import { selectArchiveMessageIds } from "@/lib/memory/select-archive";
import { estimateTextTokens } from "@/lib/memory/token-estimate";
import { countCompleteTurns } from "@/lib/memory/turns";

export function computeContextStats(
  activeMessages: DbMessageWithArchive[],
  summary: MemorySummaryRow | null,
): ContextStats {
  const summaryTokens =
    summary?.token_estimate ?? estimateTextTokens(summary?.content ?? "");
  const messageTokens = activeMessages.reduce(
    (total, message) => total + estimateTextTokens(message.content),
    0,
  );

  return {
    completeTurns: countCompleteTurns(activeMessages),
    estimatedTokens: summaryTokens + messageTokens,
  };
}

export function evaluateSummarization(options: {
  prefs: SummarizationPrefs;
  summary: MemorySummaryRow | null;
  activeMessages: DbMessageWithArchive[];
}): SummarizationPlan {
  const stats = computeContextStats(options.activeMessages, options.summary);

  if (!options.prefs.summarization_enabled) {
    return { shouldSummarize: false, stats, archiveIds: [] };
  }

  const overTurnThreshold =
    stats.completeTurns > options.prefs.summary_trigger_turns;
  const overTokenThreshold =
    stats.estimatedTokens > options.prefs.summary_trigger_tokens;

  if (!overTurnThreshold && !overTokenThreshold) {
    return { shouldSummarize: false, stats, archiveIds: [] };
  }

  const archiveIds = selectArchiveMessageIds(
    options.activeMessages,
    options.prefs,
    options.summary,
  );

  if (archiveIds.length === 0) {
    return { shouldSummarize: false, stats, archiveIds: [] };
  }

  return { shouldSummarize: true, stats, archiveIds };
}
