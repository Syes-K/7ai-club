import { upsertUserProfile } from "@/lib/data/browser/profile";
import { parseProfilePatch } from "@/lib/validation/profile";

export async function saveProfile(body: {
  nickname?: unknown;
  preferredModel?: unknown;
}): Promise<{ nickname: string | null; preferredModel: string | null }> {
  const parsed = parseProfilePatch(body);
  if (parsed.error || !parsed.fields) {
    throw new Error(parsed.error ?? "Invalid request");
  }

  if (Object.keys(parsed.fields).length === 0) {
    return { nickname: null, preferredModel: null };
  }

  const profile = await upsertUserProfile(parsed.fields);

  return {
    nickname: profile.nickname,
    preferredModel: profile.preferred_model,
  };
}
