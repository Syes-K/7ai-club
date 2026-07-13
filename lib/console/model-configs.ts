import {
  formatModelConfigLabel,
  getProviderLabel,
} from "@/lib/constants/model-providers";
import { formatPlatformModelLabel } from "@/lib/platform/model-configs";
import { getModelTypeLabel } from "@/lib/constants/model-types";
import type {
  EmbeddingModelOption,
  ModelConfigDto,
  ModelConfigRow,
} from "@/lib/data/types";
import { DEFAULT_RAG_EMBEDDING_DIMENSIONS } from "@/lib/rag/defaults";
import {
  getDefaultEmbeddingConfig,
  getEmbeddingModelLabel,
} from "@/lib/rag/embedding-models";

export { mergeUserAndPlatformModels } from "@/lib/platform/model-configs";

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
    readOnly: false,
  };
}

export function toPassedChatModelOptions(configs: ModelConfigDto[]) {
  return configs
    .filter(
      (config) =>
        config.testStatus === "passed" && config.modelType === "chat",
    )
    .map((config) => ({
      id: config.id,
      label: config.isPlatformDefault
        ? formatPlatformModelLabel(config)
        : formatModelConfigLabel(config.provider, config.modelName),
      isPlatform: config.isPlatformDefault,
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
  if (preferredConfigId) {
    const match = options.find((option) => option.id === preferredConfigId);
    if (match) {
      return match.label;
    }
  }

  const first = options[0];
  return first?.label ?? "No model configured";
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

function embeddingDtoToOption(
  config: ModelConfigDto,
  isPlatform: boolean,
): EmbeddingModelOption {
  return {
    key: formatEmbeddingModelKey(config.provider, config.modelName),
    provider: config.provider,
    model: config.modelName,
    label: isPlatform
      ? formatPlatformModelLabel(config)
      : formatModelConfigLabel(config.provider, config.modelName),
    dimensions: config.embeddingDimensions ?? DEFAULT_RAG_EMBEDDING_DIMENSIONS,
    isPlatformDefault: isPlatform,
  };
}

export function buildEmbeddingModelOptionsFromDtos(
  platformDtos: ModelConfigDto[],
  userDtos: ModelConfigDto[],
): EmbeddingModelOption[] {
  const platform = platformDtos
    .filter(
      (config) =>
        config.modelType === "embedding" && config.testStatus === "passed",
    )
    .map((config) => embeddingDtoToOption(config, true));

  const custom = userDtos
    .filter(
      (config) =>
        config.modelType === "embedding" && config.testStatus === "passed",
    )
    .map((config) => embeddingDtoToOption(config, false));

  const seen = new Set<string>();
  const merged: EmbeddingModelOption[] = [];
  for (const option of [...platform, ...custom]) {
    if (seen.has(option.key)) continue;
    seen.add(option.key);
    merged.push(option);
  }

  if (merged.length === 0) {
    return [buildPlatformDefaultEmbeddingOption()];
  }

  return merged;
}

/** @deprecated use buildEmbeddingModelOptionsFromDtos */
export function buildEmbeddingModelOptions(
  rows: ModelConfigRow[],
): EmbeddingModelOption[] {
  return buildEmbeddingModelOptionsFromDtos(
    [],
    rows.map(rowToModelConfigDto),
  );
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
