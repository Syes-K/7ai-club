import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { LANDING_COPY } from "@/lib/constants/landing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LandingHeroProps {
  user: User | null;
}

export function LandingHero({ user }: LandingHeroProps) {
  const chatHref = user ? "/chat" : "/login?next=/chat";

  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center md:px-6 md:py-28">
      <p className="font-mono text-xs tracking-[0.2em] text-[var(--neon-primary)]">
        {LANDING_COPY.eyebrow}
      </p>
      <h1 className="mt-4 font-mono text-4xl font-bold leading-tight tracking-tight text-[var(--text-primary)] md:text-6xl lg:text-7xl">
        <span className="bg-gradient-to-r from-[var(--neon-primary)] to-[var(--neon-secondary)] bg-clip-text text-transparent">
          {LANDING_COPY.headline}
        </span>
      </h1>
      <p className="mt-4 font-mono text-sm tracking-widest text-[var(--text-muted)] md:text-base">
        {LANDING_COPY.tagline}
      </p>
      <p className="mt-6 max-w-xl text-lg text-[var(--text-primary)]/80">
        {LANDING_COPY.value}
      </p>
      <div className="mt-10">
        <Link
          href={chatHref}
          className={cn(
            buttonVariants({ size: "lg" }),
            "shadow-[0_0_24px_rgba(0,128,255,0.35)] hover:shadow-[0_0_32px_rgba(0,128,255,0.5)]",
          )}
        >
          {LANDING_COPY.cta}
        </Link>
      </div>
    </section>
  );
}
