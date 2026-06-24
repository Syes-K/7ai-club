import { encryptApiKey } from "@/lib/llm/encryption";
import { createServiceClient } from "@/lib/supabase/service";

export async function upsertModelConfigSecret(
  configId: string,
  apiKey: string,
): Promise<void> {
  const service = createServiceClient();
  const ciphertext = encryptApiKey(apiKey.trim());

  const { error } = await service.from("user_model_config_secrets").upsert(
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
}

export async function deleteModelConfigSecret(configId: string): Promise<void> {
  const service = createServiceClient();
  const { error } = await service
    .from("user_model_config_secrets")
    .delete()
    .eq("config_id", configId);

  if (error) {
    throw new Error(error.message);
  }
}
