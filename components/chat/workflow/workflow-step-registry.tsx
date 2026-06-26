"use client";

import type { ComponentType } from "react";
import { DefaultStepRow } from "@/components/chat/workflow/default-step-row";
import { ReasoningStepRow } from "@/components/chat/workflow/reasoning-step-row";
import type { WorkflowStepEvent } from "@/lib/workflow/types";

export type WorkflowStepRowProps = {
  step: WorkflowStepEvent;
  isStreaming?: boolean;
};

function resolveStepKind(step: WorkflowStepEvent): WorkflowStepEvent["kind"] {
  if (step.kind) {
    return step.kind;
  }

  if (step.nodeId === "reasoning") {
    return "reasoning";
  }

  return "default";
}

export function getStepRenderer(
  step: WorkflowStepEvent,
): ComponentType<WorkflowStepRowProps> {
  const kind = resolveStepKind(step);

  if (kind === "reasoning") {
    return ReasoningStepRow;
  }

  return DefaultStepRow;
}
