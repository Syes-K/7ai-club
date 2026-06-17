import { ProfileForm } from "@/components/console/profile-form";
import { getModelOptionsForProvider } from "@/lib/constants/model-options";
import { getUserProfile } from "@/lib/console/profile";
import { getLlmProviderId } from "@/lib/llm/provider";
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
  const modelOptions = getModelOptionsForProvider(getLlmProviderId());

  return (
    <ProfileForm
      initialProfile={{
        email: user.email ?? "",
        nickname: profile?.nickname ?? null,
        preferredModel: profile?.preferred_model ?? modelOptions[0]?.id ?? null,
        modelOptions,
      }}
    />
  );
}
