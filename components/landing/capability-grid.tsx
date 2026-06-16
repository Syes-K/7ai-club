import { landingContainerClass } from "@/lib/constants/landing-layout";
import { LANDING_CAPABILITIES } from "@/lib/constants/landing";
import { cn } from "@/lib/utils";

export function CapabilityGrid() {
  return (
    <section className={cn(landingContainerClass, "pb-20")}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {LANDING_CAPABILITIES.map((item) => (
          <li
            key={item.id}
            className="group rounded-xl border border-[var(--neon-primary)]/20 bg-[var(--bg-elevated)]/60 p-6 transition-colors hover:border-[var(--neon-primary)]/50 hover:shadow-[0_0_20px_rgba(0,128,255,0.15)]"
          >
            <span className="font-mono text-xs text-[var(--neon-primary)]">
              [{item.id}]
            </span>
            <h2 className="mt-2 font-mono text-lg font-semibold text-[var(--text-primary)]">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
