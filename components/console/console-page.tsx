import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ConsoleBusyOverlay } from "@/components/console/console-busy-overlay";

interface ConsolePageProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  /** e.g. max-w-2xl for form pages; lists use full width */
  className?: string;
  /** Page-level lock during async mutations */
  busy?: boolean;
  busyLabel?: string;
}

export function ConsolePage({
  title,
  description,
  action,
  children,
  className,
  busy = false,
  busyLabel,
}: ConsolePageProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-mono text-2xl font-semibold">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
          )}
        </div>
        {action && (
          <div className={cn("shrink-0", busy && "pointer-events-none opacity-50")}>
            {action}
          </div>
        )}
      </div>
      <div className={cn("relative mt-6", busy && "min-h-[12rem]")}>
        <div className={cn(busy && "pointer-events-none select-none opacity-60")}>
          {children}
        </div>
        {busy && <ConsoleBusyOverlay label={busyLabel} />}
      </div>
    </div>
  );
}

export function ConsoleTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="mt-8 overflow-x-auto rounded-lg border border-[var(--neon-primary)]/15">
      <table className={cn("w-full min-w-[720px] text-left text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function ConsoleTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-[var(--neon-primary)]/15 bg-[var(--bg-elevated)]/80">
      {children}
    </thead>
  );
}

export function ConsoleTh({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 font-mono text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function ConsoleTableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-[var(--neon-primary)]/10">{children}</tbody>;
}
