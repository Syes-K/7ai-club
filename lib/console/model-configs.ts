import {
  formatModelConfigLabel,
  getProviderLabel,
  PLATFORM_DEFAULT_CONFIG_ID,
  PLATFORM_DEFAULT_MODEL_NAME,
  PLATFORM_DEFAULT_PROVIDER,
} from "@/lib/constants/model-providers";
import { getModelTypeLabel } from "@/lib/constants/model-types";
import type {
  EmbeddingModelOption,
  ModelConfigDto,
  ModelConfigRow,
} from "@/lib/data/types";
import { getPlatformDefaultApiKey } from "@/lib/llm/provider";
import { DEFAULT_RAG_EMBEDDING_DIMENSIONS } from "@/lib/rag/defaults";
import {
  getDefaultEmbeddingConfig,
  getEmbeddingModelLabel,
} from "@/lib/rag/embedding-models";

export function rowToModelConfigDto(row: ModelConfigRow): ModelConfigDto {
  return {
    id: row.id,
    provider: row.provider,
    modelName: row.model_name,
    modelType: row.model_type ?? "chat",
    embeddingDimensions: row.embedding_dimensions ?? null,
    providerLabel: getProviderLabel(row.provider),
    modelTypeLabel: getModelTypeLabel(row.model_type ?? "chat"),
    testStatus: row.test_status,
    testedAt: row.tested_at,
    testError: row.test_error,
    apiKeySet: row.api_key_set,
    isPlatformDefault: false,
  };
}

export function buildPlatformDefaultDto(): ModelConfigDto {
  return {
    id: PLATFORM_DEFAULT_CONFIG_ID,
    provider: PLATFORM_DEFAULT_PROVIDER,
    modelName: PLATFORM_DEFAULT_MODEL_NAME,
    modelType: "chat",
    embeddingDimensions: null,
    providerLabel: getProviderLabel(PLATFORM_DEFAULT_PROVIDER),
    modelTypeLabel: getModelTypeLabel("chat"),
    testStatus: "passed",
    testedAt: null,
    testError: null,
    apiKeySet: Boolean(getPlatformDefaultApiKey()),
    isPlatformDefault: true,
  };
}

export function mergePlatformDefault(
  rows: ModelConfigRow[],
): ModelConfigDto[] {
  return [buildPlatformDefaultDto(), ...rows.map(rowToModelConfigDto)];
}

export function toPassedChatModelOptions(configs: ModelConfigDto[]) {
  return configs
    .filter(
      (config) =>
        config.testStatus === "passed" &&
        (config.isPlatformDefault || config.modelType === "chat"),
    )
    .map((config) => ({
      id: config.id,
      label: formatModelConfigLabel(config.provider, config.modelName),
    }));
}

/** @deprecated use toPassedChatModelOptions */
export function toPassedModelOptions(configs: ModelConfigDto[]) {
  return toPassedChatModelOptions(configs);
}

export function resolvePreferenceLabel(
  preferredConfigId: string | null,
  options: { id: string; label: string }[],
): string {
  const effectiveId = preferredConfigId ?? PLATFORM_DEFAULT_CONFIG_ID;
  const match = options.find((option) => option.id === effectiveId);
  if (match) {
    return match.label;
  }

  const platform = buildPlatformDefaultDto();
  return formatModelConfigLabel(platform.provider, platform.modelName);
}

export function resolveSummaryModelLabel(
  summaryModelConfigId: string | null,
  options: { id: string; label: string }[],
): string {
  if (summaryModelConfigId == null) {
    return "Same as chat model";
  }

  const match = options.find((option) => option.id === summaryModelConfigId);
  return match?.label ?? "Same as chat model";
}

export function formatEmbeddingModelKey(provider: string, model: string): string {
  return `${provider}:${model}`;
}

export function parseEmbeddingModelKey(key: string): {
  provider: string;
  model: string;
} | null {
  const index = key.indexOf(":");
  if (index <= 0 || index === key.length - 1) {
    return null;
  }
  return {
    provider: key.slice(0, index),
    model: key.slice(index + 1),
  };
}

export function buildPlatformDefaultEmbeddingOption(): EmbeddingModelOption {
  const defaults = getDefaultEmbeddingConfig();
  return {
    key: formatEmbeddingModelKey(defaults.provider, defaults.model),
    provider: defaults.provider,
    model: defaults.model,
    label: getEmbeddingModelLabel(defaults),
    dimensions: defaults.dimensions,
    isPlatformDefault: true,
  };
}

export function buildEmbeddingModelOptions(
  rows: ModelConfigRow[],
): EmbeddingModelOption[] {
  const platformDefault = buildPlatformDefaultEmbeddingOption();
  const custom = rows
    .filter(
      (row) => row.model_type === "embedding" && row.test_status === "passed",
    )
    .map((row) => ({
      key: formatEmbeddingModelKey(row.provider, row.model_name),
      provider: row.provider,
      model: row.model_name,
      label: formatModelConfigLabel(row.provider, row.model_name),
      dimensions:
        row.embedding_dimensions ?? DEFAULT_RAG_EMBEDDING_DIMENSIONS,
      isPlatformDefault: false,
    }));

  return [platformDefault, ...custom];
}

export function buildAllowedEmbeddingKeys(
  options: EmbeddingModelOption[],
): Set<string> {
  return new Set(options.map((option) => option.key));
}

export function resolveEmbeddingDimensions(
  provider: string,
  model: string,
  options: EmbeddingModelOption[],
): number {
  const match = options.find(
    (option) => option.provider === provider && option.model === model,
  );
  return match?.dimensions ?? getDefaultEmbeddingConfig().dimensions;
}

export function resolveEmbeddingLabel(
  provider: string,
  model: string,
  options: EmbeddingModelOption[],
): string {
  const match = options.find(
    (option) => option.provider === provider && option.model === model,
  );
  return (
    match?.label ??
    getEmbeddingModelLabel({
      provider: provider as import("@/lib/llm/provider").UserLlmProviderId,
      model,
      dimensions: getDefaultEmbeddingConfig().dimensions,
    })
  );
}
