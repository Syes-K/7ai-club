import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/data/types";
import { throwIfError } from "@/lib/data/errors";
import { normalizePreferredConfigId } from "@/lib/constants/model-providers";
import {
  DEFAULT_SUMMARIZATION_ENABLED,
  DEFAULT_SUMMARY_RETAIN_TOKENS,
  DEFAULT_SUMMARY_RETAIN_TURNS,
  DEFAULT_SUMMARY_TRIGGER_TOKENS,
  DEFAULT_SUMMARY_TRIGGER_TURNS,
} from "@/lib/memory/defaults";

const PROFILE_SELECT =
  "user_id, nickname, preferred_model_config_id, summarization_enabled, summary_trigger_turns, summary_retain_turns, summary_trigger_tokens, summary_retain_tokens, summary_model_config_id";

function normalizeProfile(row: Record<string, unknown>): UserProfile {
  return {
    user_id: row.user_id as string,
    nickname: (row.nickname as string | null) ?? null,
    preferred_model_config_id:
      (row.preferred_model_config_id as string | null) ?? null,
    summarization_enabled:
      (row.summarization_enabled as boolean | undefined) ??
      DEFAULT_SUMMARIZATION_ENABLED,
    summary_trigger_turns:
      (row.summary_trigger_turns as number | undefined) ??
      DEFAULT_SUMMARY_TRIGGER_TURNS,
    summary_retain_turns:
      (row.summary_retain_turns as number | undefined) ??
      DEFAULT_SUMMARY_RETAIN_TURNS,
    summary_trigger_tokens:
      (row.summary_trigger_tokens as number | undefined) ??
      DEFAULT_SUMMARY_TRIGGER_TOKENS,
    summary_retain_tokens:
      (row.summary_retain_tokens as number | undefined) ??
      DEFAULT_SUMMARY_RETAIN_TOKENS,
    summary_model_config_id:
      (row.summary_model_config_id as string | null) ?? null,
  };
}

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
    .select(PROFILE_SELECT)
    .eq("user_id", user.id)
    .maybeSingle();

  throwIfError(error);
  if (!data) {
    return null;
  }

  return normalizeProfile(data as Record<string, unknown>);
}

export async function upsertUserProfile(fields: {
  nickname?: string | null;
  preferredModelConfigId?: string | null;
  summarizationEnabled?: boolean;
  summaryTriggerTurns?: number;
  summaryRetainTurns?: number;
  summaryTriggerTokens?: number;
  summaryRetainTokens?: number;
  summaryModelConfigId?: string | null;
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
  if ("summarizationEnabled" in fields) {
    row.summarization_enabled = fields.summarizationEnabled;
  }
  if ("summaryTriggerTurns" in fields) {
    row.summary_trigger_turns = fields.summaryTriggerTurns;
  }
  if ("summaryRetainTurns" in fields) {
    row.summary_retain_turns = fields.summaryRetainTurns;
  }
  if ("summaryTriggerTokens" in fields) {
    row.summary_trigger_tokens = fields.summaryTriggerTokens;
  }
  if ("summaryRetainTokens" in fields) {
    row.summary_retain_tokens = fields.summaryRetainTokens;
  }
  if ("summaryModelConfigId" in fields) {
    row.summary_model_config_id = fields.summaryModelConfigId ?? null;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(row, { onConflict: "user_id" })
    .select(PROFILE_SELECT)
    .single();

  throwIfError(error);
  if (!data) {
    throw new Error("Failed to save profile");
  }

  return normalizeProfile(data as Record<string, unknown>);
}
