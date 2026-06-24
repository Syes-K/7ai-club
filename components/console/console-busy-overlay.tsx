import { Loader2 } from "lucide-react";

interface ConsoleBusyOverlayProps {
  label?: string;
}

export function ConsoleBusyOverlay({ label = "Working…" }: ConsoleBusyOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-[var(--bg-base)]/70 backdrop-blur-[1px]"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="flex items-center gap-2 rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-elevated)] px-4 py-2.5 text-sm text-[var(--text-primary)] shadow-lg">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--neon-primary)]" />
        <span>{label}</span>
      </div>
    </div>
  );
}
