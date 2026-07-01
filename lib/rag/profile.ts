import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getDefaultEmbeddingConfig,
  getEmbeddingModelLabel,
} from "@/lib/rag/embedding-models";
import {
  DEFAULT_RAG_CONFIDENCE,
  DEFAULT_RAG_EMBEDDING_DIMENSIONS,
  DEFAULT_RAG_TOP_K,
} from "@/lib/rag/defaults";
import { getRagChunkOverlapTokens, getRagChunkSizeTokens } from "@/lib/rag/config";
import type { UserProfile } from "@/lib/console/profile";
import { isPlatformDefaultEmbeddingConfig } from "@/lib/rag/embedding-validation";

export type RagPreferences = {
  confidenceThreshold: number;
  topK: number;
  embeddingProvider: string;
  embeddingModel: string;
  embeddingDimensions: number;
  embeddingLabel: string;
};

export async function resolveEmbeddingDimensionsForUser(
  supabase: SupabaseClient,
  userId: string,
  provider: string,
  model: string,
): Promise<number> {
  const defaults = getDefaultEmbeddingConfig();
  if (
    isPlatformDefaultEmbeddingConfig({
      provider: provider as import("@/lib/llm/provider").UserLlmProviderId,
      model,
    }) ||
    (provider === defaults.provider && model === defaults.model)
  ) {
    return defaults.dimensions;
  }

  const { data, error } = await supabase
    .from("user_model_configs")
    .select("embedding_dimensions")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("model_name", model)
    .eq("model_type", "embedding")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.embedding_dimensions ?? DEFAULT_RAG_EMBEDDING_DIMENSIONS;
}

export function resolveRagPreferences(
  profile: UserProfile | null,
  embeddingDimensions?: number,
): RagPreferences {
  const defaults = getDefaultEmbeddingConfig();

  const embeddingProvider =
    profile?.rag_embedding_provider ?? defaults.provider;
  const embeddingModel = profile?.rag_embedding_model ?? defaults.model;
  const dimensions = embeddingDimensions ?? defaults.dimensions;

  return {
    confidenceThreshold:
      profile?.rag_confidence_threshold ?? DEFAULT_RAG_CONFIDENCE,
    topK: profile?.rag_top_k ?? DEFAULT_RAG_TOP_K,
    embeddingProvider,
    embeddingModel,
    embeddingDimensions: dimensions,
    embeddingLabel: getEmbeddingModelLabel({
      provider: embeddingProvider as RagPreferences["embeddingProvider"] &
        import("@/lib/llm/provider").UserLlmProviderId,
      model: embeddingModel,
      dimensions,
    }),
  };
}

export async function buildKnowledgeBaseInsertRow(
  userId: string,
  profile: UserProfile | null,
  supabase: SupabaseClient,
) {
  const defaults = getDefaultEmbeddingConfig();
  const provider = profile?.rag_embedding_provider ?? defaults.provider;
  const model = profile?.rag_embedding_model ?? defaults.model;
  const embeddingDimensions = await resolveEmbeddingDimensionsForUser(
    supabase,
    userId,
    provider,
    model,
  );
  const rag = resolveRagPreferences(profile, embeddingDimensions);

  return {
    user_id: userId,
    embedding_provider: rag.embeddingProvider,
    embedding_model: rag.embeddingModel,
    embedding_dimensions: rag.embeddingDimensions,
    chunk_size_tokens: getRagChunkSizeTokens(),
    chunk_overlap_tokens: getRagChunkOverlapTokens(),
    status: "processing" as const,
  };
}

export async function getUserProfileForRag(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "user_id, nickname, preferred_model_config_id, summarization_enabled, summary_trigger_turns, summary_retain_turns, summary_trigger_tokens, summary_retain_tokens, summary_model_config_id, rag_confidence_threshold, rag_top_k, rag_embedding_provider, rag_embedding_model",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as UserProfile | null;
}
