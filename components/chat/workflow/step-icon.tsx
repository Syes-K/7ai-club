"use client";

import {
  AlertCircle,
  Check,
  Loader2,
  Minus,
} from "lucide-react";
import type { WorkflowStepEvent } from "@/lib/workflow/types";

export function StepIcon({ status }: { status: WorkflowStepEvent["status"] }) {
  if (status === "running") {
    return (
      <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent-success)]" />
    );
  }

  if (status === "error") {
    return <AlertCircle className="h-3.5 w-3.5 text-red-400" />;
  }

  if (status === "skipped") {
    return <Minus className="h-3.5 w-3.5 text-[var(--text-muted)]" />;
  }

  return <Check className="h-3.5 w-3.5 text-[var(--accent-success)]" />;
}
