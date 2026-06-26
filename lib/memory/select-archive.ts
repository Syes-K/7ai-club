import type { DbMessageWithArchive } from "@/lib/data/types";
import { RETAIN_TOKEN_TOLERANCE } from "@/lib/memory/defaults";
import type { CompleteTurn, MemorySummaryRow, SummarizationPrefs } from "@/lib/memory/types";
import { estimateTextTokens } from "@/lib/memory/token-estimate";
import { partitionIntoTurns } from "@/lib/memory/turns";

function estimateTurnTokens(turn: CompleteTurn): number {
  return (
    estimateTextTokens(turn.user.content) +
    estimateTextTokens(turn.assistant.content)
  );
}

function estimateRetainBudget(
  summary: MemorySummaryRow | null,
  retainTurns: CompleteTurn[],
): number {
  const summaryTokens =
    summary?.token_estimate ?? estimateTextTokens(summary?.content ?? "");
  const messageTokens = retainTurns.reduce(
    (total, turn) => total + estimateTurnTokens(turn),
    0,
  );
  return summaryTokens + messageTokens;
}

function isOverRetainTokenBudget(
  summary: MemorySummaryRow | null,
  retainTurns: CompleteTurn[],
  retainTokens: number,
): boolean {
  const budget = estimateRetainBudget(summary, retainTurns);
  const limit = retainTokens * (1 + RETAIN_TOKEN_TOLERANCE);
  return budget > limit;
}

export function selectArchiveMessageIds(
  activeMessages: DbMessageWithArchive[],
  prefs: SummarizationPrefs,
  summary: MemorySummaryRow | null,
): string[] {
  const turns = partitionIntoTurns(activeMessages);
  if (turns.length === 0) {
    return [];
  }

  let retainCount = Math.min(prefs.summary_retain_turns, turns.length);
  if (retainCount < 1) {
    retainCount = 1;
  }

  const retainTurns = turns.slice(-retainCount);
  const archiveTurns = turns.slice(0, turns.length - retainTurns.length);

  while (
    retainTurns.length > 1 &&
    isOverRetainTokenBudget(summary, retainTurns, prefs.summary_retain_tokens)
  ) {
    const oldest = retainTurns.shift();
    if (!oldest) {
      break;
    }
    archiveTurns.push(oldest);
  }

  return archiveTurns.flatMap((turn) => [turn.user.id, turn.assistant.id]);
}
