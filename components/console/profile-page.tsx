"use client";

import type { ProfileDto } from "@/lib/data/types";
import { AccountCard } from "@/components/console/account-card";
import { PreferencesCard } from "@/components/console/preferences-card";
import { ConsolePage } from "@/components/console/console-page";

interface ProfilePageProps {
  profile: ProfileDto;
}

export function ProfilePage({ profile }: ProfilePageProps) {
  return (
    <ConsolePage
      title="Profile"
      description="Your account details and chat preferences."
    >
      <div className="mt-6 space-y-6">
        <AccountCard email={profile.email} initialNickname={profile.nickname} />

        <PreferencesCard
          initialPreferredConfigId={profile.preferredModelConfigId}
          initialPreferredLabel={profile.preferredLabel}
          modelOptions={profile.modelOptions}
        />
      </div>
    </ConsolePage>
  );
}
