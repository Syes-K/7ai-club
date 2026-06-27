"use client";

import { AlertCircle, Check, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { StepPanelHeader } from "@/lib/workflow/step-panel-header";

interface WorkflowStepHeaderProps {
  header: StepPanelHeader;
  expanded: boolean;
  onToggle: () => void;
}

function HeaderIcon({ variant }: { variant: StepPanelHeader["variant"] }) {
  if (variant === "running") {
    return (
      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--accent-success)]" />
    );
  }

  if (variant === "error") {
    return <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />;
  }

  return <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent-success)]" />;
}

export function WorkflowStepHeader({
  header,
  expanded,
  onToggle,
}: WorkflowStepHeaderProps) {
  const toggleHint = expanded ? "Hide steps" : "Show steps";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="group flex w-full items-start gap-2 rounded-md py-0.5 font-mono text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-base)]/40 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]/40"
      aria-expanded={expanded}
      aria-label={`${header.title}. ${toggleHint}`}
    >
      <span className="mt-0.5 shrink-0">
        <HeaderIcon variant={header.variant} />
      </span>
      <span className="min-w-0 flex-1 truncate text-left">{header.title}</span>
      <span className="mt-0.5 shrink-0">
        {expanded ? (
          <ChevronDown
            className="h-3.5 w-3.5 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]"
            aria-hidden
          />
        ) : (
          <ChevronRight
            className="h-3.5 w-3.5 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]"
            aria-hidden
          />
        )}
      </span>
    </button>
  );
}
