import { generateText } from "ai";
import { estimateTextTokens } from "@/lib/memory/token-estimate";
import {
  markMessagesSummarized,
  upsertMemorySummary,
} from "@/lib/memory/persistence";
import { resolveSummaryModel } from "@/lib/memory/resolve-summary-model";
import { buildSummaryPrompt } from "@/lib/memory/summary-prompt";
import { getChatModelForResolvedConfig } from "@/lib/llm/provider";
import { getLlmTimeoutMs } from "@/lib/llm/timeout";
import type { WorkflowContext } from "@/lib/workflow/types";

export async function executeSummarizeHistory(
  ctx: WorkflowContext,
): Promise<string> {
  const plan = ctx.summarizationPlan;
  if (!plan?.shouldSummarize || plan.archiveIds.length === 0) {
    return "Skipped";
  }

  if (!ctx.dbMessages) {
    throw new Error("Conversation messages not loaded");
  }

  const archiveIdSet = new Set(plan.archiveIds);
  const messagesToArchive = ctx.dbMessages.filter((message) =>
    archiveIdSet.has(message.id),
  );

  if (messagesToArchive.length === 0) {
    return "Skipped";
  }

  const resolvedSummary = await resolveSummaryModel(ctx);
  const prompt = buildSummaryPrompt({
    priorSummary: ctx.memorySummary?.content ?? null,
    messagesToArchive,
  });

  const result = await generateText({
    model: getChatModelForResolvedConfig(resolvedSummary),
    prompt,
    maxOutputTokens: 2048,
    abortSignal: AbortSignal.timeout(getLlmTimeoutMs()),
  });

  const content = result.text.trim();
  if (!content) {
    throw new Error("Empty summary from model");
  }

  ctx.memorySummary = await upsertMemorySummary(
    ctx.conversationId,
    content,
    ctx.supabase,
  );

  await markMessagesSummarized(plan.archiveIds, ctx.supabase);

  for (const message of ctx.dbMessages) {
    if (archiveIdSet.has(message.id)) {
      message.summarized_at = new Date().toISOString();
    }
  }

  const archivedTurns = messagesToArchive.length / 2;
  const savedTokens = messagesToArchive.reduce(
    (total, message) => total + estimateTextTokens(message.content),
    0,
  );

  const headline = `Summarized ${archivedTurns} turns · ~${estimateTextTokens(content)} tokens in memory · ~${savedTokens} tokens saved from context`;

  return `${headline}\n\n${content}`;
}
