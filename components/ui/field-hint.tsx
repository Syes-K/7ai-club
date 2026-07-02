import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldHintProps {
  text: string;
  className?: string;
}

export function FieldHint({ text, className }: FieldHintProps) {
  return (
    <span className={cn("group relative inline-flex align-middle", className)}>
      <HelpCircle
        className="h-3.5 w-3.5 text-[var(--text-muted)]"
        aria-hidden
      />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-[var(--neon-primary)]/25 bg-[var(--bg-elevated)] px-3 py-2 text-xs font-normal normal-case leading-relaxed tracking-normal text-[var(--text-muted)] opacity-0 shadow-[0_0_16px_rgba(0,128,255,0.12)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
