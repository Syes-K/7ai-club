import { loadDbMessagesWithArchive } from "@/lib/memory/persistence";
import { runWorkflow } from "@/lib/workflow/runner";
import { evaluateSummarizationNode } from "@/lib/workflow/nodes/evaluate-summarization";
import { executeSummarizeHistory } from "@/lib/workflow/nodes/summarize-history";
import { buildStepSuccessPayload } from "@/lib/workflow/step-payload";
import type { StepEmitter, WorkflowContext } from "@/lib/workflow/types";

async function runSummarizeHistoryStep(
  ctx: WorkflowContext,
  emit: StepEmitter,
): Promise<void> {
  const startedAt = new Date().toISOString();
  const nodeId = "summarize_history";
  const label = "Summarizing history";

  await emit({
    runId: ctx.runId,
    nodeId,
    label,
    status: "running",
    startedAt,
  });

  try {
    const plan = ctx.summarizationPlan;
    const shouldRun =
      plan?.shouldSummarize === true && plan.archiveIds.length > 0;

    if (!shouldRun) {
      await emit({
        runId: ctx.runId,
        nodeId,
        label,
        status: "skipped",
        summary: "Skipped",
        startedAt,
        finishedAt: new Date().toISOString(),
      });
      return;
    }

    const rawSummary = await executeSummarizeHistory(ctx);

    await emit(
      buildStepSuccessPayload(nodeId, rawSummary, {
        runId: ctx.runId,
        nodeId,
        label,
        status: "success",
        startedAt,
        finishedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Summarization failed";

    await emit({
      runId: ctx.runId,
      nodeId,
      label,
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
