export const dynamic = "force-dynamic";

import { GridBackground } from "@/components/ui/grid-background";
import { SiteHeader } from "@/components/layout/site-header";
import { CapabilityGrid } from "@/components/landing/capability-grid";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative min-h-dvh bg-[var(--bg-base)] text-[var(--text-primary)]">
      <GridBackground />
      <SiteHeader user={user} fullWidth compactUserMenu />
      <main>
        <LandingHero user={user} />
        <CapabilityGrid />
      </main>
      <LandingFooter />
    </div>
  );
}
