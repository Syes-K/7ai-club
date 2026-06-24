import { upsertUserProfile } from "@/lib/data/browser/profile";
import {
  parseAccountPatch,
  parsePreferencesPatch,
} from "@/lib/validation/profile";
import { listPassedModelOptions } from "@/lib/services/browser/model-configs";
import {
  normalizePreferredConfigId,
  PLATFORM_DEFAULT_CONFIG_ID,
} from "@/lib/constants/model-providers";

export async function saveAccount(body: {
  nickname?: unknown;
}): Promise<{ nickname: string | null }> {
  const parsed = parseAccountPatch(body);
  if (parsed.error || !parsed.fields) {
    throw new Error(parsed.error ?? "Invalid request");
  }

  const profile = await upsertUserProfile({
    nickname: parsed.fields.nickname,
  });

  return { nickname: profile.nickname };
}

export async function savePreferences(body: {
  preferredModelConfigId?: unknown;
}): Promise<{ preferredModelConfigId: string | null }> {
  const passedOptions = await listPassedModelOptions();
  const allowedIds = new Set(passedOptions.map((option) => option.id));

  const parsed = parsePreferencesPatch(body, allowedIds);
  if (parsed.error || !parsed.fields) {
    throw new Error(parsed.error ?? "Invalid request");
  }

  const profile = await upsertUserProfile({
    preferredModelConfigId: parsed.fields.preferredModelConfigId,
  });

  const stored = profile.preferred_model_config_id;
  return {
    preferredModelConfigId: stored ?? PLATFORM_DEFAULT_CONFIG_ID,
  };
}

export function toUiPreferredConfigId(
  storedId: string | null | undefined,
): string {
  return storedId ?? PLATFORM_DEFAULT_CONFIG_ID;
}

export { normalizePreferredConfigId };
