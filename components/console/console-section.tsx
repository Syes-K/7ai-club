import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ConsoleBusyOverlay } from "@/components/console/console-busy-overlay";

interface ConsoleSectionProps {
  children: ReactNode;
  busy?: boolean;
  busyLabel?: string;
  className?: string;
}

export function ConsoleSection({
  children,
  busy = false,
  busyLabel,
  className,
}: ConsoleSectionProps) {
  return (
    <section
      className={cn(
        "relative rounded-xl border border-[var(--neon-primary)]/20 bg-[var(--bg-elevated)]/60 p-6",
        busy && "min-h-[8rem]",
        className,
      )}
    >
      <div className={cn(busy && "pointer-events-none select-none opacity-60")}>
        {children}
      </div>
      {busy && <ConsoleBusyOverlay label={busyLabel} />}
    </section>
  );
}
