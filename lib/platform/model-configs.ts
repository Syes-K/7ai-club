import {
  formatModelConfigLabel,
  getProviderLabel,
} from "@/lib/constants/model-providers";
import { getModelTypeLabel } from "@/lib/constants/model-types";
import type { ModelTypeId } from "@/lib/constants/model-types";
import type { ModelConfigDto } from "@/lib/data/types";
import type { UserLlmProviderId } from "@/lib/llm/provider";
import { createClient } from "@/lib/supabase/client";

export type PlatformModelConfigRow = {
  id: string;
  display_name: string | null;
  provider: UserLlmProviderId;
  model_name: string;
  model_type: string;
  embedding_dimensions: number | null;
  enabled: boolean;
  sort_order: number;
  test_status: "untested" | "passed" | "failed";
  tested_at: string | null;
  test_error: string | null;
  api_key_set: boolean;
  created_at: string;
  updated_at: string;
};

export const PLATFORM_MODEL_COLUMNS =
  "id, display_name, provider, model_name, model_type, embedding_dimensions, enabled, sort_order, test_status, tested_at, test_error, api_key_set, created_at, updated_at";

export function platformRowToDto(row: PlatformModelConfigRow): ModelConfigDto {
  return {
    id: row.id,
    provider: row.provider,
    modelName: row.model_name,
    modelType: (row.model_type ?? "chat") as ModelTypeId,
    embeddingDimensions: row.embedding_dimensions,
    providerLabel: getProviderLabel(row.provider),
    modelTypeLabel: getModelTypeLabel((row.model_type ?? "chat") as ModelTypeId),
    testStatus: row.test_status,
    testedAt: row.tested_at,
    testError: row.test_error,
    apiKeySet: row.api_key_set,
    isPlatformDefault: true,
    readOnly: true,
    displayName: row.display_name,
  };
}

export function mergeUserAndPlatformModels(
  userRows: ModelConfigDto[],
  platformRows: ModelConfigDto[],
): ModelConfigDto[] {
  return [...platformRows, ...userRows];
}

export function formatPlatformModelLabel(dto: ModelConfigDto): string {
  return `Platform — ${formatModelConfigLabel(dto.provider, dto.modelName)}`;
}

export async function listPlatformModelConfigsForUser(): Promise<ModelConfigDto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("platform_model_configs")
    .select(PLATFORM_MODEL_COLUMNS)
    .eq("enabled", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PlatformModelConfigRow[]).map(platformRowToDto);
}
