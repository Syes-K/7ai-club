import { buildStepSuccessPayload } from "@/lib/workflow/step-payload";
import type { WorkflowContext, WorkflowNode, StepEmitter } from "@/lib/workflow/types";

export async function runWorkflow(
  nodes: WorkflowNode[],
  ctx: WorkflowContext,
  emit: StepEmitter,
): Promise<void> {
  for (const node of nodes) {
    const startedAt = new Date().toISOString();

    await emit({
      runId: ctx.runId,
      nodeId: node.id,
      label: node.label,
      status: "running",
      startedAt,
    });

    try {
      const summary = await node.run(ctx);

      await emit(
        buildStepSuccessPayload(node.id, summary, {
          runId: ctx.runId,
          nodeId: node.id,
          label: node.label,
          status: "success",
          startedAt,
          finishedAt: new Date().toISOString(),
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Workflow step failed";

      await emit({
        runId: ctx.runId,
        nodeId: node.id,
        label: node.label,
        status: "error",
        error: message,
        startedAt,
        finishedAt: new Date().toISOString(),
      });

      throw error;
    }
  }
}
