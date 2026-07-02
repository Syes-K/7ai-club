import { landingContainerClass } from "@/lib/constants/landing-layout";
import { LANDING_COPY } from "@/lib/constants/landing";
import { cn } from "@/lib/utils";

export function LandingFooter() {
  return (
    <footer className="mt-auto shrink-0 border-t border-[var(--neon-primary)]/15 py-6">
      <div className={cn(landingContainerClass, "text-center")}>
        <p className="font-mono text-xs text-[var(--text-muted)]">
          {LANDING_COPY.footer}
        </p>
      </div>
    </footer>
  );
}
