import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptApiKey } from "@/lib/llm/encryption";
import { formatModelConfigLabel } from "@/lib/constants/model-providers";
import type { ResolvedUserModel, UserLlmProviderId } from "@/lib/llm/provider";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import {
  formatPlatformModelLabel,
  type PlatformModelConfigRow,
} from "@/lib/platform/model-configs";
import { platformRowToDto } from "@/lib/platform/model-configs";

type PlatformRow = Pick<
  PlatformModelConfigRow,
  "id" | "provider" | "model_name" | "model_type" | "test_status" | "enabled" | "api_key_set" | "display_name"
>;

export async function resolveDefaultPlatformChatModel(
  supabase?: SupabaseClient,
): Promise<ResolvedUserModel | null> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("platform_model_configs")
    .select("id, provider, model_name, model_type, test_status, enabled, api_key_set, display_name")
    .eq("enabled", true)
    .eq("test_status", "passed")
    .eq("model_type", "chat")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return resolvePlatformModelById((data as PlatformRow).id, client);
}

export async function resolvePlatformModelById(
  configId: string,
  supabase?: SupabaseClient,
): Promise<ResolvedUserModel | null> {
  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("platform_model_configs")
    .select("id, provider, model_name, model_type, test_status, enabled, api_key_set, display_name")
    .eq("id", configId)
    .eq("enabled", true)
    .eq("test_status", "passed")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as PlatformRow;

  if (row.model_type && row.model_type !== "chat") {
    return null;
  }

  if (!row.api_key_set) {
    return null;
  }

  const service = createServiceClient();
  const { data: secret, error: secretError } = await service
    .from("platform_model_config_secrets")
    .select("api_key_ciphertext")
    .eq("config_id", row.id)
    .maybeSingle();

  if (secretError || !secret?.api_key_ciphertext) {
    return null;
  }

  const dto = platformRowToDto(row as PlatformModelConfigRow);
  const label = formatPlatformModelLabel(dto);

  return {
    configId: row.id,
    provider: row.provider as UserLlmProviderId,
    modelName: row.model_name,
    apiKey: decryptApiKey(secret.api_key_ciphertext),
    label,
  };
}

export async function loadResolvedPlatformModelForTest(
  configId: string,
): Promise<ResolvedUserModel> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("platform_model_configs")
    .select("id, provider, model_name, model_type, api_key_set, display_name")
    .eq("id", configId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Model config not found");
  }

  const row = data as PlatformRow;

  if (!row.api_key_set) {
    throw new Error("API key is not configured");
  }

  const { data: secret, error: secretError } = await service
    .from("platform_model_config_secrets")
    .select("api_key_ciphertext")
    .eq("config_id", configId)
    .maybeSingle();

  if (secretError || !secret?.api_key_ciphertext) {
    throw new Error("API key is not configured");
  }

  const dto = platformRowToDto(row as PlatformModelConfigRow);

  return {
    configId: row.id,
    provider: row.provider as UserLlmProviderId,
    modelName: row.model_name,
    apiKey: decryptApiKey(secret.api_key_ciphertext),
    label: formatPlatformModelLabel(dto),
  };
}

export function platformLabelFromRow(row: PlatformRow): string {
  if (row.display_name?.trim()) {
    return row.display_name.trim();
  }
  return formatModelConfigLabel(
    row.provider as UserLlmProviderId,
    row.model_name,
  );
}
