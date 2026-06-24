import {
  formatModelConfigLabel,
  getProviderLabel,
  PLATFORM_DEFAULT_CONFIG_ID,
  PLATFORM_DEFAULT_MODEL_NAME,
  PLATFORM_DEFAULT_PROVIDER,
} from "@/lib/constants/model-providers";
import type { ModelConfigDto, ModelConfigRow } from "@/lib/data/types";
import { getPlatformDefaultApiKey } from "@/lib/llm/provider";

export function rowToModelConfigDto(row: ModelConfigRow): ModelConfigDto {
  return {
    id: row.id,
    provider: row.provider,
    modelName: row.model_name,
    providerLabel: getProviderLabel(row.provider),
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
    providerLabel: getProviderLabel(PLATFORM_DEFAULT_PROVIDER),
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

export function toPassedModelOptions(configs: ModelConfigDto[]) {
  return configs
    .filter((config) => config.testStatus === "passed")
    .map((config) => ({
      id: config.id,
      label: formatModelConfigLabel(config.provider, config.modelName),
    }));
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
