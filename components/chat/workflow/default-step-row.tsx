"use client";

import { StepIcon } from "@/components/chat/workflow/step-icon";
import { SummaryDetailBlock } from "@/components/chat/workflow/summary-detail-block";
import { parseStepDetail } from "@/lib/workflow/step-payload";
import type { WorkflowStepEvent } from "@/lib/workflow/types";
import { cn } from "@/lib/utils";

interface DefaultStepRowProps {
  step: WorkflowStepEvent;
}

export function DefaultStepRow({ step }: DefaultStepRowProps) {
  const { headline, detail } = parseStepDetail(step);
  const hasDetail = Boolean(detail?.trim());
  const isSkipped = step.status === "skipped";

  return (
    <li
      className={cn(
        "flex items-start gap-2 font-mono text-xs",
        isSkipped && "opacity-60",
        step.status === "error"
          ? "text-red-300"
          : "text-[var(--text-muted)]",
      )}
    >
      <span className="mt-0.5 shrink-0">
        <StepIcon status={step.status} />
      </span>
      <span className="min-w-0 flex-1">
        {hasDetail ? (
          <SummaryDetailBlock step={step} inlineLabel={step.label} />
        ) : (
          <>
            <span className="text-[var(--text-primary)]">{step.label}</span>
            {headline ? (
              <span className="ml-2 text-[var(--text-muted)]">{headline}</span>
            ) : null}
          </>
        )}
        {step.error ? (
          <span className="mt-1 block text-red-300">{step.error}</span>
        ) : null}
      </span>
    </li>
  );
}
