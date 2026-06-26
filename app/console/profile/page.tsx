import { ProfilePage } from "@/components/console/profile-page";
import {
  listPassedModelOptionsForUser,
} from "@/lib/console/model-configs-server";
import {
  resolvePreferenceLabel,
  resolveSummaryModelLabel,
} from "@/lib/console/model-configs";
import { getUserProfile } from "@/lib/console/profile";
import {
  DEFAULT_SUMMARIZATION_ENABLED,
  DEFAULT_SUMMARY_RETAIN_TOKENS,
  DEFAULT_SUMMARY_RETAIN_TURNS,
  DEFAULT_SUMMARY_TRIGGER_TOKENS,
  DEFAULT_SUMMARY_TRIGGER_TURNS,
} from "@/lib/memory/defaults";
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
        summarizationEnabled:
          profile?.summarization_enabled ?? DEFAULT_SUMMARIZATION_ENABLED,
        summaryTriggerTurns:
          profile?.summary_trigger_turns ?? DEFAULT_SUMMARY_TRIGGER_TURNS,
        summaryRetainTurns:
          profile?.summary_retain_turns ?? DEFAULT_SUMMARY_RETAIN_TURNS,
        summaryTriggerTokens:
          profile?.summary_trigger_tokens ?? DEFAULT_SUMMARY_TRIGGER_TOKENS,
        summaryRetainTokens:
          profile?.summary_retain_tokens ?? DEFAULT_SUMMARY_RETAIN_TOKENS,
        summaryModelConfigId: profile?.summary_model_config_id ?? null,
        summaryModelLabel: resolveSummaryModelLabel(
          profile?.summary_model_config_id ?? null,
          modelOptions,
        ),
      }}
    />
  );
}
