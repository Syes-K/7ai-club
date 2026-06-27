"use client";

import { memo, useCallback, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ReasoningDetailPanel } from "@/components/chat/workflow/reasoning-detail-panel";
import { StepIcon } from "@/components/chat/workflow/step-icon";
import type { WorkflowStepEvent, WorkflowStepStatus } from "@/lib/workflow/types";

interface ReasoningStepRowProps {
  step: WorkflowStepEvent;
  isStreaming?: boolean;
}

type ReasoningStepCollapsedProps = {
  label: string;
  status: WorkflowStepStatus;
  onExpand: () => void;
};

const ReasoningStepCollapsed = memo(function ReasoningStepCollapsed({
  label,
  status,
  onExpand,
}: ReasoningStepCollapsedProps) {
  return (
    <li className="flex items-start gap-2 font-mono text-xs text-[var(--text-muted)]">
      <span className="mt-0.5 shrink-0">
        <StepIcon status={status} />
      </span>
      <span className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex max-w-full items-center gap-1 text-left transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]/40"
          aria-expanded={false}
          aria-label={`${label}. Show reasoning`}
        >
          <span className="text-[var(--text-primary)]">{label}</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </button>
      </span>
    </li>
  );
});

function ReasoningStepLabelOnly({
  label,
  status,
}: {
  label: string;
  status: WorkflowStepStatus;
}) {
  return (
    <li className="flex items-start gap-2 font-mono text-xs text-[var(--text-muted)]">
      <span className="mt-0.5 shrink-0">
        <StepIcon status={status} />
      </span>
      <span className="min-w-0 flex-1 text-[var(--text-primary)]">{label}</span>
    </li>
  );
}

export function ReasoningStepRow({
  step,
  isStreaming = false,
}: ReasoningStepRowProps) {
  const [expanded, setExpanded] = useState(false);
  const onExpand = useCallback(() => setExpanded(true), []);
  const onCollapse = useCallback(() => setExpanded(false), []);

  const canExpand =
    step.status === "running" || Boolean(step.detail?.length);

  if (!canExpand) {
    return <ReasoningStepLabelOnly label={step.label} status={step.status} />;
  }

  if (!expanded) {
    return (
      <ReasoningStepCollapsed
        label={step.label}
        status={step.status}
        onExpand={onExpand}
      />
    );
  }

  const reasoningStreaming = isStreaming && step.status === "running";

  return (
    <li className="flex items-start gap-2 font-mono text-xs text-[var(--text-muted)]">
      <span className="mt-0.5 shrink-0">
        <StepIcon status={step.status} />
      </span>
      <span className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onCollapse}
          className="inline-flex max-w-full items-center gap-1 text-left transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]/40"
          aria-expanded
          aria-label={`${step.label}. Hide reasoning`}
        >
          <span className="text-[var(--text-primary)]">{step.label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
        </button>
        <ReasoningDetailPanel
          runId={step.runId}
          nodeId={step.nodeId}
          persistedDetail={step.detail}
          isStreaming={reasoningStreaming}
        />
      </span>
    </li>
  );
}
