import type { SupabaseClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { decryptApiKey } from "@/lib/llm/encryption";
import {
  formatModelConfigLabel,
} from "@/lib/constants/model-providers";
import {
  buildPlatformDefaultResolved,
  getChatModelForResolvedConfig,
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
    .select("id, user_id, provider, model_name, test_status, api_key_set")
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
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const result = await generateText({
      model: getChatModelForResolvedConfig(resolved),
      messages: [{ role: "user", content: "Hi" }],
      maxOutputTokens: 16,
      abortSignal: AbortSignal.timeout(30_000),
    });

    if (!result.text?.trim()) {
      return { ok: false, error: "Empty response from provider" };
    }

    return { ok: true, text: result.text.trim() };
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
    .select("id, user_id, provider, model_name, api_key_set")
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
