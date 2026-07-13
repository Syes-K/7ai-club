import {
  normalizePreferredConfigId,
  SUMMARY_SAME_AS_CHAT_ID,
} from "@/lib/constants/model-providers";
import { formatEmbeddingModelKey } from "@/lib/console/model-configs";

export const NICKNAME_MAX_LENGTH = 32;

export function validateNickname(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed.length > NICKNAME_MAX_LENGTH) {
    return `Nickname must be ${NICKNAME_MAX_LENGTH} characters or fewer`;
  }
  return null;
}

function parsePositiveInt(
  value: unknown,
  fieldLabel: string,
  min: number,
): { value?: number; error?: string } {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min) {
    return { error: `Invalid ${fieldLabel}` };
  }
  return { value };
}

function parseSummaryModelConfigId(
  raw: unknown,
  allowedIds: Set<string>,
): { value?: string | null; error?: string } {
  if (raw == null || raw === "" || raw === SUMMARY_SAME_AS_CHAT_ID) {
    return { value: null };
  }

  if (typeof raw !== "string") {
    return { error: "Invalid summary model" };
  }

  if (!allowedIds.has(raw)) {
    return { error: "Selected summary model is not available" };
  }

  return { value: normalizePreferredConfigId(raw) };
}

function parseRagConfidenceThreshold(
  value: unknown,
): { value?: number; error?: string } {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { error: "Invalid confidence threshold" };
  }
  if (value <= 0 || value > 1) {
    return { error: "Confidence threshold must be between 0 and 1" };
  }
  return { value: Math.round(value * 1000) / 1000 };
}

function parseRagTopK(value: unknown): { value?: number; error?: string } {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { error: "Invalid Top K" };
  }
  if (value < 1 || value > 50) {
    return { error: "Top K must be between 1 and 50" };
  }
  return { value };
}

function parseRagEmbedding(
  providerRaw: unknown,
  modelRaw: unknown,
  allowedEmbeddingKeys: Set<string>,
): { value?: { provider: string; model: string }; error?: string } {
  if (typeof providerRaw !== "string" || typeof modelRaw !== "string") {
    return { error: "Invalid embedding model" };
  }

  const key = formatEmbeddingModelKey(providerRaw, modelRaw);
  if (!allowedEmbeddingKeys.has(key)) {
    return { error: "Selected embedding model is not available" };
  }

  return { value: { provider: providerRaw, model: modelRaw } };
}

export function parseAccountPatch(body: {
  nickname?: unknown;
}): {
  fields?: { nickname: string | null };
  error?: string;
} {
  if (!("nickname" in body)) {
    return { error: "No fields to update" };
  }

  const raw = body.nickname;
  if (raw != null && typeof raw !== "string") {
    return { error: "Invalid nickname" };
  }

  const trimmed = raw?.trim() ?? "";
  const nicknameError = validateNickname(trimmed || null);
  if (nicknameError) {
    return { error: nicknameError };
  }

  return { fields: { nickname: trimmed || null } };
}

export type PreferencesPatchFields = {
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
};

export function parsePreferencesPatch(
  body: {
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
    ragQueryOptimizeEnabled?: unknown;
  },
  allowedIds: Set<string>,
  allowedEmbeddingKeys: Set<string>,
): {
  fields?: PreferencesPatchFields;
  error?: string;
} {
  const hasAnyField =
    "preferredModelConfigId" in body ||
    "summarizationEnabled" in body ||
    "summaryTriggerTurns" in body ||
    "summaryRetainTurns" in body ||
    "summaryTriggerTokens" in body ||
    "summaryRetainTokens" in body ||
    "summaryModelConfigId" in body ||
    "ragConfidenceThreshold" in body ||
    "ragTopK" in body ||
    "ragEmbeddingProvider" in body ||
    "ragEmbeddingModel" in body ||
    "ragQueryOptimizeEnabled" in body;

  if (!hasAnyField) {
    return { error: "No fields to update" };
  }

  const fields: PreferencesPatchFields = {};

  if ("preferredModelConfigId" in body) {
    const raw = body.preferredModelConfigId;
    if (raw == null || raw === "") {
      fields.preferredModelConfigId = null;
    } else if (typeof raw !== "string") {
      return { error: "Invalid model preference" };
    } else if (!allowedIds.has(raw)) {
      return { error: "Selected model is not available" };
    } else {
      fields.preferredModelConfigId = normalizePreferredConfigId(raw);
    }
  }

  if ("summarizationEnabled" in body) {
    if (typeof body.summarizationEnabled !== "boolean") {
      return { error: "Invalid summarization setting" };
    }
    fields.summarizationEnabled = body.summarizationEnabled;
  }

  if ("summaryTriggerTurns" in body) {
    const parsed = parsePositiveInt(
      body.summaryTriggerTurns,
      "trigger turn count",
      1,
    );
    if (parsed.error) return parsed;
    fields.summaryTriggerTurns = parsed.value;
  }

  if ("summaryRetainTurns" in body) {
    const parsed = parsePositiveInt(
      body.summaryRetainTurns,
      "retain turn count",
      0,
    );
    if (parsed.error) return parsed;
    fields.summaryRetainTurns = parsed.value;
  }

  if ("summaryTriggerTokens" in body) {
    const parsed = parsePositiveInt(
      body.summaryTriggerTokens,
      "trigger token count",
      1,
    );
    if (parsed.error) return parsed;
    fields.summaryTriggerTokens = parsed.value;
  }

  if ("summaryRetainTokens" in body) {
    const parsed = parsePositiveInt(
      body.summaryRetainTokens,
      "retain token count",
      1,
    );
    if (parsed.error) return parsed;
    fields.summaryRetainTokens = parsed.value;
  }

  if ("summaryModelConfigId" in body) {
    const parsed = parseSummaryModelConfigId(body.summaryModelConfigId, allowedIds);
    if (parsed.error) return parsed;
    fields.summaryModelConfigId = parsed.value ?? null;
  }

  if ("ragConfidenceThreshold" in body) {
    const parsed = parseRagConfidenceThreshold(body.ragConfidenceThreshold);
    if (parsed.error) return parsed;
    fields.ragConfidenceThreshold = parsed.value;
  }

  if ("ragTopK" in body) {
    const parsed = parseRagTopK(body.ragTopK);
    if (parsed.error) return parsed;
    fields.ragTopK = parsed.value;
  }

  if ("ragEmbeddingProvider" in body || "ragEmbeddingModel" in body) {
    if (!("ragEmbeddingProvider" in body) || !("ragEmbeddingModel" in body)) {
      return { error: "Embedding model provider and model are required together" };
    }
    const parsed = parseRagEmbedding(
      body.ragEmbeddingProvider,
      body.ragEmbeddingModel,
      allowedEmbeddingKeys,
    );
    if (parsed.error || !parsed.value) return parsed;
    fields.ragEmbeddingProvider = parsed.value.provider;
    fields.ragEmbeddingModel = parsed.value.model;
  }

  if ("ragQueryOptimizeEnabled" in body) {
    if (typeof body.ragQueryOptimizeEnabled !== "boolean") {
      return { error: "Invalid query optimization setting" };
    }
    fields.ragQueryOptimizeEnabled = body.ragQueryOptimizeEnabled;
  }

  const triggerTurns = fields.summaryTriggerTurns;
  const retainTurns = fields.summaryRetainTurns;
  const triggerTokens = fields.summaryTriggerTokens;
  const retainTokens = fields.summaryRetainTokens;

  if (
    triggerTurns != null &&
    retainTurns != null &&
    retainTurns > triggerTurns
  ) {
    return { error: "Retain turns cannot exceed trigger turns" };
  }

  if (
    triggerTokens != null &&
    retainTokens != null &&
    retainTokens > triggerTokens
  ) {
    return { error: "Retain tokens cannot exceed trigger tokens" };
  }

  return { fields };
}
