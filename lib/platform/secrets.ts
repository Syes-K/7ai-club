import { encryptApiKey } from "@/lib/llm/encryption";
import { createServiceClient } from "@/lib/supabase/service";

export async function upsertPlatformModelSecret(
  configId: string,
  apiKey: string,
): Promise<void> {
  const service = createServiceClient();
  const ciphertext = encryptApiKey(apiKey.trim());

  const { error } = await service.from("platform_model_config_secrets").upsert(
    {
      config_id: configId,
      api_key_ciphertext: ciphertext,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "config_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  const { error: flagError } = await service
    .from("platform_model_configs")
    .update({ api_key_set: true, updated_at: new Date().toISOString() })
    .eq("id", configId);

  if (flagError) {
    throw new Error(flagError.message);
  }
}

export async function deletePlatformModelSecret(configId: string): Promise<void> {
  const service = createServiceClient();
  const { error } = await service
    .from("platform_model_config_secrets")
    .delete()
    .eq("config_id", configId);

  if (error) {
    throw new Error(error.message);
  }
}
