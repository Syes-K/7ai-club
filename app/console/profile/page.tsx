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
import {
  DEFAULT_RAG_CONFIDENCE,
  DEFAULT_RAG_EMBEDDING_MODEL,
  DEFAULT_RAG_EMBEDDING_PROVIDER,
  DEFAULT_RAG_TOP_K,
} from "@/lib/rag/defaults";
import {
  listEmbeddingModelOptionsForUser,
  resolveEmbeddingLabel,
} from "@/lib/console/model-configs-server";
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
  const embeddingModelOptions = await listEmbeddingModelOptionsForUser(
    user.id,
  ).catch(() => []);
  const preferredConfigId = profile?.preferred_model_config_id ?? null;
  const ragEmbeddingProvider =
    profile?.rag_embedding_provider ?? DEFAULT_RAG_EMBEDDING_PROVIDER;
  const ragEmbeddingModel =
    profile?.rag_embedding_model ?? DEFAULT_RAG_EMBEDDING_MODEL;

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
        ragConfidenceThreshold:
          profile?.rag_confidence_threshold ?? DEFAULT_RAG_CONFIDENCE,
        ragTopK: profile?.rag_top_k ?? DEFAULT_RAG_TOP_K,
        ragEmbeddingProvider,
        ragEmbeddingModel,
        ragEmbeddingLabel: resolveEmbeddingLabel(
          ragEmbeddingProvider,
          ragEmbeddingModel,
          embeddingModelOptions,
        ),
        embeddingModelOptions,
      }}
    />
  );
}
