import type { ModelConfigDto } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export function statusBadgeClass(status: ModelConfigDto["testStatus"]): string {
  switch (status) {
    case "passed":
      return "border-[var(--accent-success)]/40 text-[var(--accent-success)]";
    case "failed":
      return "border-red-400/40 text-red-400";
    default:
      return "border-[var(--text-muted)]/40 text-[var(--text-muted)]";
  }
}

export function statusLabel(status: ModelConfigDto["testStatus"]): string {
  switch (status) {
    case "passed":
      return "Passed";
    case "failed":
      return "Failed";
    default:
      return "Untested";
  }
}

export const MODEL_PILL_CLASS =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs";

export function formatModelConfigTestLabel(config: ModelConfigDto): string {
  return `${config.providerLabel} — ${config.modelName}`;
}

interface ModelTestStatusBadgeProps {
  config: ModelConfigDto;
}

export function ModelTestStatusBadge({ config }: ModelTestStatusBadgeProps) {
  return (
    <span
      className={cn(MODEL_PILL_CLASS, statusBadgeClass(config.testStatus))}
      title={config.testError ?? undefined}
    >
      {statusLabel(config.testStatus)}
    </span>
  );
}

interface ModelTestStatusCellProps {
  config: ModelConfigDto;
  className?: string;
}

export function ModelTestStatusCell({ config, className }: ModelTestStatusCellProps) {
  return (
    <td className={cn("max-w-[8.5rem] overflow-hidden px-4 py-3", className)}>
      <ModelTestStatusBadge config={config} />
    </td>
  );
}
