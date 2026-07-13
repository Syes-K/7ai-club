import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_RAG_CONFIDENCE,
  DEFAULT_RAG_QUERY_OPTIMIZE_ENABLED,
  DEFAULT_RAG_TOP_K,
} from "@/lib/rag/defaults";
import {
  DEFAULT_SUMMARIZATION_ENABLED,
  DEFAULT_SUMMARY_RETAIN_TOKENS,
  DEFAULT_SUMMARY_RETAIN_TURNS,
  DEFAULT_SUMMARY_TRIGGER_TOKENS,
  DEFAULT_SUMMARY_TRIGGER_TURNS,
} from "@/lib/memory/defaults";
import {
  fetchDefaultPlatformChatModelId,
  fetchDefaultPlatformEmbedding,
  isPlatformChatModelAvailable,
} from "@/lib/platform/profile-defaults";

export type UserProfile = {
  user_id: string;
  nickname: string | null;
  preferred_model_config_id: string | null;
  summarization_enabled: boolean;
  summary_trigger_turns: number;
  summary_retain_turns: number;
  summary_trigger_tokens: number;
  summary_retain_tokens: number;
  summary_model_config_id: string | null;
  rag_confidence_threshold: number;
  rag_top_k: number;
  rag_embedding_provider: string;
  rag_embedding_model: string;
  rag_query_optimize_enabled: boolean;
};

const PROFILE_SELECT =
  "user_id, nickname, preferred_model_config_id, summarization_enabled, summary_trigger_turns, summary_retain_turns, summary_trigger_tokens, summary_retain_tokens, summary_model_config_id, rag_confidence_threshold, rag_top_k, rag_embedding_provider, rag_embedding_model, rag_query_optimize_enabled";

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
    rag_confidence_threshold:
      (row.rag_confidence_threshold as number | undefined) ??
      DEFAULT_RAG_CONFIDENCE,
    rag_top_k: (row.rag_top_k as number | undefined) ?? DEFAULT_RAG_TOP_K,
    rag_embedding_provider:
      (row.rag_embedding_provider as string | undefined) ?? "siliconflow",
    rag_embedding_model:
      (row.rag_embedding_model as string | undefined) ?? "BAAI/bge-m3",
    rag_query_optimize_enabled:
      (row.rag_query_optimize_enabled as boolean | undefined) ??
      DEFAULT_RAG_QUERY_OPTIMIZE_ENABLED,
  };
}

export async function getUserProfile(
  userId: string,
  supabase?: SupabaseClient,
): Promise<UserProfile | null> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("user_profiles")
    .select(PROFILE_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return normalizeProfile(data as Record<string, unknown>);
}

/**
 * Ensures a profile row exists and seeds platform defaults for new users:
 * first passed+enabled platform chat model + embedding (admin sort_order).
 */
export async function ensureUserProfileDefaults(
  userId: string,
  supabase?: SupabaseClient,
): Promise<UserProfile | null> {
  const client = supabase ?? (await createClient());
  const [existing, defaultChatId, defaultEmbedding] = await Promise.all([
      getUserProfile(userId, client),
      fetchDefaultPlatformChatModelId(client),
      fetchDefaultPlatformEmbedding(client),
    ]);

  const patch: Parameters<typeof upsertUserProfile>[1] = {};
  let needsWrite = false;

  if (!existing) {
    needsWrite = true;
    if (defaultChatId) {
      patch.preferredModelConfigId = defaultChatId;
    }
    if (defaultEmbedding) {
      patch.ragEmbeddingProvider = defaultEmbedding.provider;
      patch.ragEmbeddingModel = defaultEmbedding.model;
    }
  } else {
    if (!existing.preferred_model_config_id && defaultChatId) {
      patch.preferredModelConfigId = defaultChatId;
      needsWrite = true;
    } else if (
      existing.preferred_model_config_id &&
      defaultChatId &&
      existing.preferred_model_config_id !== defaultChatId
    ) {
      const { data: userOwned } = await client
        .from("user_model_configs")
        .select("id")
        .eq("id", existing.preferred_model_config_id)
        .eq("user_id", userId)
        .maybeSingle();

      if (!userOwned) {
        const platformStillValid = await isPlatformChatModelAvailable(
          existing.preferred_model_config_id,
          client,
        );
        if (!platformStillValid) {
          patch.preferredModelConfigId = defaultChatId;
          needsWrite = true;
        }
      }
    }
  }

  if (!needsWrite) {
    return existing;
  }

  return upsertUserProfile(userId, patch, client);
}

export async function upsertUserProfile(
  userId: string,
  fields: {
    nickname?: string | null;
    preferredModelConfigId?: string | null;
    summarizationEnabled?: boolean;
    summaryTriggerTurns?: number;
    summaryRetainTurns?: number;
    summaryTriggerTokens?: number;
    summaryRetainTokens?: number;
    summaryModelConfigId?: string | null;
    ragConfidenceThreshold?: number;
    ragTopK?: number;
    ragEmbeddingProvider?: string;
    ragEmbeddingModel?: string;
    ragQueryOptimizeEnabled?: boolean;
  },
  supabase?: SupabaseClient,
): Promise<UserProfile> {
  const client = supabase ?? (await createClient());
  const row: Record<string, unknown> = { user_id: userId };

  if ("nickname" in fields) {
    row.nickname = fields.nickname;
  }
  if ("preferredModelConfigId" in fields) {
    row.preferred_model_config_id = fields.preferredModelConfigId ?? null;
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
  if ("ragConfidenceThreshold" in fields) {
    row.rag_confidence_threshold = fields.ragConfidenceThreshold;
  }
  if ("ragTopK" in fields) {
    row.rag_top_k = fields.ragTopK;
  }
  if ("ragEmbeddingProvider" in fields) {
    row.rag_embedding_provider = fields.ragEmbeddingProvider;
  }
  if ("ragEmbeddingModel" in fields) {
    row.rag_embedding_model = fields.ragEmbeddingModel;
  }
  if ("ragQueryOptimizeEnabled" in fields) {
    row.rag_query_optimize_enabled = fields.ragQueryOptimizeEnabled;
  }

  const { data, error } = await client
    .from("user_profiles")
    .upsert(row, { onConflict: "user_id" })
    .select(PROFILE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save profile");
  }

  return normalizeProfile(data as Record<string, unknown>);
}
