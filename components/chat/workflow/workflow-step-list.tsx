"use client";

import { getStepRenderer } from "@/components/chat/workflow/workflow-step-registry";
import type { WorkflowStepEvent } from "@/lib/workflow/types";

interface WorkflowStepListProps {
  steps: WorkflowStepEvent[];
  streamingNodeId?: string | null;
}

export function WorkflowStepList({
  steps,
  streamingNodeId = null,
}: WorkflowStepListProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <ul
      className="m-0 list-none space-y-1.5 p-0"
      role="list"
      aria-label="Workflow steps"
    >
      {steps.map((step) => {
        const Row = getStepRenderer(step);
        const isStreaming =
          streamingNodeId != null && step.nodeId === streamingNodeId;

        return (
          <Row key={step.nodeId} step={step} isStreaming={isStreaming} />
        );
      })}
    </ul>
  );
}
