import { createClient } from "@/lib/supabase/server";

export type UserProfile = {
  user_id: string;
  nickname: string | null;
  preferred_model_config_id: string | null;
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, nickname, preferred_model_config_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserProfile | null;
}

export async function upsertUserProfile(
  userId: string,
  fields: {
    nickname?: string | null;
    preferredModelConfigId?: string | null;
  },
): Promise<UserProfile> {
  const supabase = await createClient();
  const row: Record<string, unknown> = { user_id: userId };

  if ("nickname" in fields) {
    row.nickname = fields.nickname;
  }
  if ("preferredModelConfigId" in fields) {
    row.preferred_model_config_id = fields.preferredModelConfigId ?? null;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(row, { onConflict: "user_id" })
    .select("user_id, nickname, preferred_model_config_id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save profile");
  }

  return data as UserProfile;
}
