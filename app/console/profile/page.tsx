import { ProfilePage } from "@/components/console/profile-page";
import {
  listPassedModelOptionsForUser,
} from "@/lib/console/model-configs-server";
import { resolvePreferenceLabel } from "@/lib/console/model-configs";
import { getUserProfile } from "@/lib/console/profile";
import { createClient } from "@/lib/supabase/server";

export default async function ConsoleProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profile = await getUserProfile(user.id).catch(() => null);
  const modelOptions = await listPassedModelOptionsForUser(user.id).catch(() => []);
  const preferredConfigId = profile?.preferred_model_config_id ?? null;

  return (
    <ProfilePage
      profile={{
        email: user.email ?? "",
        nickname: profile?.nickname ?? null,
        preferredModelConfigId: preferredConfigId,
        preferredLabel: resolvePreferenceLabel(preferredConfigId, modelOptions),
        modelOptions,
      }}
    />
  );
}
