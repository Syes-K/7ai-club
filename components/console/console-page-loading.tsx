import { ConsoleBusyOverlay } from "@/components/console/console-busy-overlay";

interface ConsolePageLoadingProps {
  title: string;
  description?: string;
  label: string;
}

export function ConsolePageLoading({
  title,
  description,
  label,
}: ConsolePageLoadingProps) {
  return (
    <div className="w-full" aria-busy="true" aria-live="polite">
      <div>
        <h1 className="font-mono text-2xl font-semibold">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
        )}
      </div>
      <div className="relative min-h-[12rem]">
        <div className="min-h-[8rem] opacity-60" />
        <ConsoleBusyOverlay label={label} />
      </div>
    </div>
  );
}
