import { platformRowToDto, type PlatformModelConfigRow } from "@/lib/platform/model-configs";
import type { ModelConfigDto } from "@/lib/data/types";
import { createServiceClient } from "@/lib/supabase/service";

const PLATFORM_COLUMNS =
  "id, display_name, provider, model_name, model_type, embedding_dimensions, enabled, sort_order, test_status, tested_at, test_error, api_key_set, created_at, updated_at";

export function adminPlatformRowToDto(row: PlatformModelConfigRow): ModelConfigDto {
  const dto = platformRowToDto(row);
  return { ...dto, readOnly: false, enabled: row.enabled };
}

export async function listAllPlatformModelConfigs(): Promise<ModelConfigDto[]> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("platform_model_configs")
    .select(PLATFORM_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PlatformModelConfigRow[]).map(adminPlatformRowToDto);
}

export async function getPlatformModelRow(id: string): Promise<PlatformModelConfigRow | null> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("platform_model_configs")
    .select(PLATFORM_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PlatformModelConfigRow | null) ?? null;
}
