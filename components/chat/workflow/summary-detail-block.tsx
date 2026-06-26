"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { parseStepDetail } from "@/lib/workflow/step-payload";
import type { WorkflowStepEvent } from "@/lib/workflow/types";
import { cn } from "@/lib/utils";

interface SummaryDetailBlockProps {
  step: WorkflowStepEvent;
  /** Label on the same line as chevron; headline renders inside the expanded panel. */
  inlineLabel?: string;
}

export function SummaryDetailBlock({
  step,
  inlineLabel,
}: SummaryDetailBlockProps) {
  const [expanded, setExpanded] = useState(false);
  const { headline, detail, detailFormat } = parseStepDetail(step);
  const toggleHint = expanded ? "Hide summary" : "Show summary";

  if (!detail?.trim()) {
    return null;
  }

  const toggleLabel = inlineLabel ?? "Summary";

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="inline-flex max-w-full items-center gap-1 text-left transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]/40"
        aria-expanded={expanded}
        aria-label={`${toggleLabel}. ${toggleHint}`}
      >
        {inlineLabel ? (
          <span className="text-[var(--text-primary)]">{inlineLabel}</span>
        ) : null}
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
      </button>
      {expanded ? (
        <div className="mt-2">
          {headline ? (
            <p className="mb-2 text-xs leading-relaxed text-[var(--text-muted)]">
              {headline}
            </p>
          ) : null}
          {detailFormat === "markdown" ? (
            <MarkdownContent
              content={detail}
              className="max-h-48 overflow-auto rounded-md border border-[var(--neon-primary)]/15 bg-[var(--bg-base)]/60 p-2 text-xs leading-relaxed text-[var(--text-muted)]"
            />
          ) : (
            <pre
              className={cn(
                "max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-[var(--neon-primary)]/15 bg-[var(--bg-base)]/60 p-2 text-xs leading-relaxed text-[var(--text-muted)]",
              )}
            >
              {detail}
            </pre>
          )}
        </div>
      ) : null}
    </>
  );
}
