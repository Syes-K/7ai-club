import { getWorkflowNodeCatalogEntry } from "@/lib/workflow/node-catalog";
import type { WorkflowStepEvent } from "@/lib/workflow/types";

function resolveOrder(step: WorkflowStepEvent): number {
  if (step.order != null) {
    return step.order;
  }

  return getWorkflowNodeCatalogEntry(step.nodeId)?.order ?? Number.MAX_SAFE_INTEGER;
}

export function sortSteps(steps: WorkflowStepEvent[]): WorkflowStepEvent[] {
  return [...steps].sort((left, right) => {
    const leftOrder = resolveOrder(left);
    const rightOrder = resolveOrder(right);

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    const leftStarted = left.startedAt ?? "";
    const rightStarted = right.startedAt ?? "";

    if (leftStarted !== rightStarted) {
      return leftStarted.localeCompare(rightStarted);
    }

    return left.nodeId.localeCompare(right.nodeId);
  });
}
