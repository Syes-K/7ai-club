import type { UIMessageStreamWriter } from "ai";
import { enrichWorkflowStepEvent } from "@/lib/workflow/step-payload";
import type {
  StepEmitter,
  WorkflowStepDeltaEvent,
  WorkflowStepEvent,
} from "@/lib/workflow/types";

export function makeStepEmitter(options: {
  writer: UIMessageStreamWriter;
  persistStep: (event: WorkflowStepEvent) => Promise<void>;
  runId: string;
}): StepEmitter {
  return async (event) => {
    const payload = enrichWorkflowStepEvent({
      ...event,
      runId: options.runId,
    });

    options.writer.write({
      type: "data-workflow-step",
      id: `${payload.runId}:${payload.nodeId}`,
      data: payload,
    });

    await options.persistStep(payload);
  };
}

export function writeWorkflowStepDelta(
  writer: UIMessageStreamWriter,
  delta: WorkflowStepDeltaEvent,
): void {
  writer.write({
    type: "data-workflow-step-delta",
    id: `${delta.runId}:${delta.nodeId}`,
    data: delta,
  });
}
