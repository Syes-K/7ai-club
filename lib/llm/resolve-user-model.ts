import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptApiKey } from "@/lib/llm/encryption";
import { probeProviderChatCompletion } from "@/lib/llm/connectivity-test";
import { probeProviderEmbedding } from "@/lib/llm/embedding-connectivity-test";
import {
  formatModelConfigLabel,
} from "@/lib/constants/model-providers";
import {
  buildPlatformDefaultResolved,
  type ResolvedUserModel,
  type UserLlmProviderId,
} from "@/lib/llm/provider";
import { classifyLlmError, toUserFacingLlmMessage } from "@/lib/llm/errors";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export class ModelNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelNotReadyError";
  }
}

type ModelConfigRow = {
  id: string;
  user_id: string;
  provider: UserLlmProviderId;
  model_name: string;
  model_type: string;
  embedding_dimensions: number | null;
  test_status: string;
  api_key_set: boolean;
};

export async function resolveUserModelForChat(
  userId: string,
  preferredConfigId: string | null,
  supabase?: SupabaseClient,
): Promise<ResolvedUserModel | null> {
  if (!preferredConfigId) {
    return buildPlatformDefaultResolved();
  }

  const client = supabase ?? (await createClient());
  const { data, error } = await client
    .from("user_model_configs")
    .select("id, user_id, provider, model_name, model_type, test_status, api_key_set")
    .eq("id", preferredConfigId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return buildPlatformDefaultResolved();
  }

  const row = data as ModelConfigRow;

  if (row.test_status !== "passed") {
    throw new ModelNotReadyError(
      "Selected model is not ready. Test it in Console → Models.",
    );
  }

  if (row.model_type && row.model_type !== "chat") {
    throw new ModelNotReadyError(
      "Selected model is not a chat model. Choose a chat model in Profile.",
    );
  }

  if (!row.api_key_set) {
    throw new ModelNotReadyError(
      "Selected model has no API key. Update it in Console → Models.",
    );
  }

  const service = createServiceClient();
  const { data: secret, error: secretError } = await service
    .from("user_model_config_secrets")
    .select("api_key_ciphertext")
    .eq("config_id", row.id)
    .maybeSingle();

  if (secretError || !secret?.api_key_ciphertext) {
    throw new ModelNotReadyError(
      "Selected model API key is missing. Update it in Console → Models.",
    );
  }

  const apiKey = decryptApiKey(secret.api_key_ciphertext);

  return {
    configId: row.id,
    provider: row.provider,
    modelName: row.model_name,
    apiKey,
    label: formatModelConfigLabel(row.provider, row.model_name),
  };
}

export async function runModelConnectivityTest(
  resolved: ResolvedUserModel,
  options?: { modelType?: string; embeddingDimensions?: number | null },
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    if (options?.modelType === "embedding") {
      const result = await probeProviderEmbedding(resolved, {
        dimensions: options.embeddingDimensions ?? undefined,
      });
      return result.ok
        ? { ok: true, text: `Embedding dim ${result.dimensions}` }
        : result;
    }
    return await probeProviderChatCompletion(resolved);
  } catch (error) {
    const kind = classifyLlmError(error);
    return {
      ok: false,
      error: toUserFacingLlmMessage(kind, resolved.provider),
    };
  }
}

export async function loadResolvedModelForTest(
  userId: string,
  configId: string,
): Promise<ResolvedUserModel> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_model_configs")
    .select("id, user_id, provider, model_name, model_type, embedding_dimensions, api_key_set")
    .eq("id", configId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Model config not found");
  }

  const row = data as ModelConfigRow;

  if (!row.api_key_set) {
    throw new Error("API key is not configured");
  }

  const service = createServiceClient();
  const { data: secret, error: secretError } = await service
    .from("user_model_config_secrets")
    .select("api_key_ciphertext")
    .eq("config_id", row.id)
    .maybeSingle();

  if (secretError || !secret?.api_key_ciphertext) {
    throw new Error("API key is not configured");
  }

  return {
    configId: row.id,
    provider: row.provider,
    modelName: row.model_name,
    apiKey: decryptApiKey(secret.api_key_ciphertext),
    label: formatModelConfigLabel(row.provider, row.model_name),
  };
}
