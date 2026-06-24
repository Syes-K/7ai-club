"use client";

import { useState } from "react";
import { AlertCircle, Check, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { WorkflowStepEvent } from "@/lib/workflow/types";
import { cn } from "@/lib/utils";

function StepIcon({ status }: { status: WorkflowStepEvent["status"] }) {
  if (status === "running") {
    return (
      <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent-success)]" />
    );
  }

  if (status === "error") {
    return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
  }

  return <Check className="h-3.5 w-3.5 text-[var(--accent-success)]" />;
}

interface WorkflowStepListProps {
  steps: WorkflowStepEvent[];
}

export function WorkflowStepList({ steps }: WorkflowStepListProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <ul
      className="space-y-1.5"
      role="list"
      aria-label="Workflow steps"
    >
      {steps.map((step) => (
        <li
          key={step.nodeId}
          className={cn(
            "flex items-start gap-2 font-mono text-xs",
            step.status === "error"
              ? "text-red-300"
              : "text-[var(--text-muted)]",
          )}
        >
          <span className="mt-0.5 shrink-0">
            <StepIcon status={step.status} />
          </span>
          <span className="min-w-0">
            <span className="text-[var(--text-primary)]">{step.label}</span>
            {step.summary ? (
              <span className="ml-2 text-[var(--text-muted)]">{step.summary}</span>
            ) : null}
            {step.error ? (
              <span className="mt-1 block text-red-300">{step.error}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface WorkflowStepSummaryProps {
  steps: WorkflowStepEvent[];
  defaultExpanded?: boolean;
}

export function WorkflowStepSummary({
  steps,
  defaultExpanded = false,
}: WorkflowStepSummaryProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (steps.length === 0) {
    return null;
  }

  const hasError = steps.some((step) => step.status === "error");
  const label = hasError
    ? `${steps.length} steps (${steps.filter((s) => s.status === "error").length} failed)`
    : `${steps.length} steps completed`;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-1.5 rounded-md font-mono text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]/40"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <span>{label}</span>
      </button>
      {expanded ? (
        <div className="mt-2">
          <WorkflowStepList steps={steps} />
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated Use WorkflowStepList inside AssistantTurn */
export function WorkflowStepTimeline({
  steps,
  visible,
}: {
  steps: WorkflowStepEvent[];
  visible: boolean;
}) {
  if (!visible || steps.length === 0) {
    return null;
  }

  return <WorkflowStepList steps={steps} />;
}
