import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/data/types";
import { throwIfError } from "@/lib/data/errors";
import { normalizePreferredConfigId } from "@/lib/constants/model-providers";

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, nickname, preferred_model_config_id")
    .eq("user_id", user.id)
    .maybeSingle();

  throwIfError(error);
  return data as UserProfile | null;
}

export async function upsertUserProfile(fields: {
  nickname?: string | null;
  preferredModelConfigId?: string | null;
}): Promise<UserProfile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const row: Record<string, unknown> = { user_id: user.id };

  if ("nickname" in fields) {
    row.nickname = fields.nickname;
  }
  if ("preferredModelConfigId" in fields) {
    row.preferred_model_config_id = normalizePreferredConfigId(
      fields.preferredModelConfigId,
    );
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(row, { onConflict: "user_id" })
    .select("user_id, nickname, preferred_model_config_id")
    .single();

  throwIfError(error);
  if (!data) {
    throw new Error("Failed to save profile");
  }

  return data as UserProfile;
}
