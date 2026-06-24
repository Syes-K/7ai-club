import type { UIMessageStreamWriter } from "ai";
import type { StepEmitter, WorkflowStepEvent } from "@/lib/workflow/types";

export function makeStepEmitter(options: {
  writer: UIMessageStreamWriter;
  persistStep: (event: WorkflowStepEvent) => Promise<void>;
  runId: string;
}): StepEmitter {
  return async (event) => {
    const payload: WorkflowStepEvent = {
      ...event,
      runId: options.runId,
    };

    options.writer.write({
      type: "data-workflow-step",
      id: `${payload.runId}:${payload.nodeId}`,
      data: payload,
    });

    await options.persistStep(payload);
  };
}
