"use client";

import { memo, useState } from "react";
import { WorkflowStepHeader } from "@/components/chat/workflow/workflow-step-header";
import { WorkflowStepList } from "@/components/chat/workflow/workflow-step-list";
import { computeStepPanelHeader } from "@/lib/workflow/step-panel-header";
import type { WorkflowStepEvent } from "@/lib/workflow/types";

interface WorkflowStepPanelProps {
  steps: WorkflowStepEvent[];
  isSettled: boolean;
  defaultExpanded?: boolean;
  streamingNodeId?: string | null;
}

export const WorkflowStepPanel = memo(function WorkflowStepPanel({
  steps,
  isSettled,
  defaultExpanded = false,
  streamingNodeId = null,
}: WorkflowStepPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (steps.length === 0) {
    return null;
  }

  const header = computeStepPanelHeader(steps, { isSettled });

  return (
    <div role="status" aria-live="polite">
      <WorkflowStepHeader
        header={header}
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
      />
      {expanded ? (
        <div className="mt-2">
          <WorkflowStepList
            steps={steps}
            streamingNodeId={streamingNodeId}
          />
        </div>
      ) : null}
    </div>
  );
});
