export const dynamic = "force-dynamic";

import { GridBackground } from "@/components/ui/grid-background";
import { SiteHeader } from "@/components/layout/site-header";
import { CapabilityGrid } from "@/components/landing/capability-grid";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { landingMainContentClass } from "@/lib/constants/landing-layout";
import { getUserProfile } from "@/lib/console/profile";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? await getUserProfile(user.id).catch(() => null)
    : null;

  return (
    <div className="relative flex min-h-dvh flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <GridBackground />
      <SiteHeader
        user={user}
        nickname={profile?.nickname}
        compactUserMenu
        showChatLink={false}
        fullWidth
      />
      <main className="flex flex-1 flex-col">
        <div className={landingMainContentClass}>
          <LandingHero user={user} />
          <CapabilityGrid />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
