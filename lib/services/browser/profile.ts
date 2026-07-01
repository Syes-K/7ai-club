import { upsertUserProfile } from "@/lib/data/browser/profile";
import {
  parseAccountPatch,
  parsePreferencesPatch,
} from "@/lib/validation/profile";
import { listPassedModelOptions } from "@/lib/services/browser/model-configs";
import { listEmbeddingModelOptions } from "@/lib/services/browser/embedding-models";
import { buildAllowedEmbeddingKeys } from "@/lib/console/model-configs";
import {
  normalizePreferredConfigId,
  PLATFORM_DEFAULT_CONFIG_ID,
  SUMMARY_SAME_AS_CHAT_ID,
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
  summarizationEnabled?: unknown;
  summaryTriggerTurns?: unknown;
  summaryRetainTurns?: unknown;
  summaryTriggerTokens?: unknown;
  summaryRetainTokens?: unknown;
  summaryModelConfigId?: unknown;
  ragConfidenceThreshold?: unknown;
  ragTopK?: unknown;
  ragEmbeddingProvider?: unknown;
  ragEmbeddingModel?: unknown;
}): Promise<{
  preferredModelConfigId: string | null;
  summarizationEnabled: boolean;
  summaryTriggerTurns: number;
  summaryRetainTurns: number;
  summaryTriggerTokens: number;
  summaryRetainTokens: number;
  summaryModelConfigId: string | null;
  ragConfidenceThreshold: number;
  ragTopK: number;
  ragEmbeddingProvider: string;
  ragEmbeddingModel: string;
}> {
  const passedOptions = await listPassedModelOptions();
  const allowedIds = new Set(passedOptions.map((option) => option.id));
  const embeddingOptions = await listEmbeddingModelOptions();
  const allowedEmbeddingKeys = buildAllowedEmbeddingKeys(embeddingOptions);

  const parsed = parsePreferencesPatch(body, allowedIds, allowedEmbeddingKeys);
  if (parsed.error || !parsed.fields) {
    throw new Error(parsed.error ?? "Invalid request");
  }

  const profile = await upsertUserProfile({
    preferredModelConfigId: parsed.fields.preferredModelConfigId,
    summarizationEnabled: parsed.fields.summarizationEnabled,
    summaryTriggerTurns: parsed.fields.summaryTriggerTurns,
    summaryRetainTurns: parsed.fields.summaryRetainTurns,
    summaryTriggerTokens: parsed.fields.summaryTriggerTokens,
    summaryRetainTokens: parsed.fields.summaryRetainTokens,
    summaryModelConfigId: parsed.fields.summaryModelConfigId,
    ragConfidenceThreshold: parsed.fields.ragConfidenceThreshold,
    ragTopK: parsed.fields.ragTopK,
    ragEmbeddingProvider: parsed.fields.ragEmbeddingProvider,
    ragEmbeddingModel: parsed.fields.ragEmbeddingModel,
  });

  const stored = profile.preferred_model_config_id;
  return {
    preferredModelConfigId: stored ?? PLATFORM_DEFAULT_CONFIG_ID,
    summarizationEnabled: profile.summarization_enabled,
    summaryTriggerTurns: profile.summary_trigger_turns,
    summaryRetainTurns: profile.summary_retain_turns,
    summaryTriggerTokens: profile.summary_trigger_tokens,
    summaryRetainTokens: profile.summary_retain_tokens,
    summaryModelConfigId: profile.summary_model_config_id,
    ragConfidenceThreshold: profile.rag_confidence_threshold,
    ragTopK: profile.rag_top_k,
    ragEmbeddingProvider: profile.rag_embedding_provider,
    ragEmbeddingModel: profile.rag_embedding_model,
  };
}

export function toUiPreferredConfigId(
  storedId: string | null | undefined,
): string {
  return storedId ?? PLATFORM_DEFAULT_CONFIG_ID;
}

export function toUiSummaryModelConfigId(
  storedId: string | null | undefined,
): string {
  return storedId ?? SUMMARY_SAME_AS_CHAT_ID;
}

export { normalizePreferredConfigId };
