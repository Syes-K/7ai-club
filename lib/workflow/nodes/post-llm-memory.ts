import { loadDbMessagesWithArchive } from "@/lib/memory/persistence";
import { runWorkflow } from "@/lib/workflow/runner";
import { evaluateSummarizationNode } from "@/lib/workflow/nodes/evaluate-summarization";
import { executeSummarizeHistory } from "@/lib/workflow/nodes/summarize-history";
import type { StepEmitter, WorkflowContext } from "@/lib/workflow/types";

async function runSummarizeHistoryStep(
  ctx: WorkflowContext,
  emit: StepEmitter,
): Promise<void> {
  const startedAt = new Date().toISOString();

  await emit({
    runId: ctx.runId,
    nodeId: "summarize_history",
    label: "Summarizing history",
    status: "running",
    startedAt,
  });

  try {
    const plan = ctx.summarizationPlan;
    const summary =
      plan?.shouldSummarize && plan.archiveIds.length > 0
        ? await executeSummarizeHistory(ctx)
        : "Skipped";

    await emit({
      runId: ctx.runId,
      nodeId: "summarize_history",
      label: "Summarizing history",
      status: "success",
      summary,
      startedAt,
      finishedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Summarization failed";

    await emit({
      runId: ctx.runId,
      nodeId: "summarize_history",
      label: "Summarizing history",
      status: "error",
      error: message,
      startedAt,
      finishedAt: new Date().toISOString(),
    });

    console.error("Summarization failed:", error);
  }
}

export async function runPostLlmMemorySteps(
  ctx: WorkflowContext,
  emit: StepEmitter,
): Promise<void> {
  ctx.dbMessages = await loadDbMessagesWithArchive(
    ctx.conversationId,
    ctx.supabase,
  );

  await runWorkflow([evaluateSummarizationNode], ctx, emit);
  await runSummarizeHistoryStep(ctx, emit);
}
