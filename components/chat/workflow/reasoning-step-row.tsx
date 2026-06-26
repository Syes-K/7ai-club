"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { StepIcon } from "@/components/chat/workflow/step-icon";
import { parseStepDetail } from "@/lib/workflow/step-payload";
import type { WorkflowStepEvent } from "@/lib/workflow/types";

interface ReasoningStepRowProps {
  step: WorkflowStepEvent;
  isStreaming?: boolean;
}

export function ReasoningStepRow({
  step,
  isStreaming = false,
}: ReasoningStepRowProps) {
  const [expanded, setExpanded] = useState(false);
  const detailRef = useRef<HTMLPreElement>(null);
  const { detail } = parseStepDetail(step);
  const hasDetail = Boolean(detail?.trim());
  const showExpanded = expanded && hasDetail;
  const toggleHint = expanded ? "Hide reasoning" : "Show reasoning";

  useEffect(() => {
    if (!showExpanded || !isStreaming) {
      return;
    }

    const node = detailRef.current;
    if (!node) {
      return;
    }

    node.scrollTop = node.scrollHeight;
  }, [showExpanded, detail, isStreaming]);

  useEffect(() => {
    if (!expanded) {
      return;
    }

    detailRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [expanded]);

  return (
    <li className="flex items-start gap-2 font-mono text-xs text-[var(--text-muted)]">
      <span className="mt-0.5 shrink-0">
        <StepIcon status={step.status} />
      </span>
      <span className="min-w-0 flex-1">
        {hasDetail ? (
          <>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex max-w-full items-center gap-1 text-left transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]/40"
              aria-expanded={expanded}
              aria-label={`${step.label}. ${toggleHint}`}
            >
              <span className="text-[var(--text-primary)]">{step.label}</span>
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              )}
            </button>
            {showExpanded ? (
              <pre
                ref={detailRef}
                className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--neon-primary)]/15 bg-[var(--bg-base)]/60 p-2 text-xs leading-relaxed text-[var(--text-muted)]"
              >
                {detail}
                {isStreaming ? (
                  <span className="inline-block h-3 w-1 animate-pulse bg-[var(--accent-success)] align-middle" />
                ) : null}
              </pre>
            ) : null}
          </>
        ) : (
          <span className="text-[var(--text-primary)]">{step.label}</span>
        )}
      </span>
    </li>
  );
}
