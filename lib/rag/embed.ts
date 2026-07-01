import { decryptApiKey } from "@/lib/llm/encryption";
import {
  getProviderBaseUrl,
  getProviderRuntimeConfig,
  isUserLlmProviderId,
  type UserLlmProviderId,
} from "@/lib/llm/provider";
import { createServiceClient } from "@/lib/supabase/service";
import { getLlmTimeoutMs } from "@/lib/llm/timeout";
import type { EmbeddingConfig } from "@/lib/rag/embedding-models";
import {
  isPlatformDefaultEmbeddingConfig,
  validateEmbeddingConfig,
  type EmbeddingAuthContext,
} from "@/lib/rag/embedding-validation";
import { getRagEmbedBatchSize } from "@/lib/rag/config";

type EmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
  error?: { message?: string };
};

function getPlatformEmbeddingApiKey(provider: UserLlmProviderId): string {
  const config = getProviderRuntimeConfig(provider);
  const apiKey = process.env[config.apiKeyEnv]?.trim();
  if (!apiKey) {
    throw new Error(`${config.apiKeyEnv} is not set`);
  }
  return apiKey;
}

async function getUserEmbeddingApiKey(
  userId: string,
  config: EmbeddingConfig,
): Promise<string> {
  const service = createServiceClient();
  const { data: row, error } = await service
    .from("user_model_configs")
    .select("id, api_key_set")
    .eq("user_id", userId)
    .eq("provider", config.provider)
    .eq("model_name", config.model)
    .eq("model_type", "embedding")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!row?.api_key_set) {
    throw new Error(
      "Embedding model API key is not configured. Test the model in Console → Models.",
    );
  }

  const { data: secret, error: secretError } = await service
    .from("user_model_config_secrets")
    .select("api_key_ciphertext")
    .eq("config_id", row.id)
    .maybeSingle();

  if (secretError || !secret?.api_key_ciphertext) {
    throw new Error("Embedding model API key is missing");
  }

  return decryptApiKey(secret.api_key_ciphertext);
}

async function resolveEmbeddingApiKey(
  config: EmbeddingConfig,
  auth?: EmbeddingAuthContext,
): Promise<string> {
  if (isPlatformDefaultEmbeddingConfig(config)) {
    return getPlatformEmbeddingApiKey(config.provider);
  }

  if (!auth?.userId) {
    throw new Error(
      "User embedding model requires authentication context for API key lookup",
    );
  }

  return getUserEmbeddingApiKey(auth.userId, config);
}

async function embedBatch(
  texts: string[],
  config: EmbeddingConfig,
  auth?: EmbeddingAuthContext,
): Promise<number[][]> {
  validateEmbeddingConfig(config);

  const baseURL = getProviderBaseUrl(config.provider);
  const apiKey = await resolveEmbeddingApiKey(config, auth);
  const timeoutMs = getLlmTimeoutMs();

  const response = await fetch(`${baseURL}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      input: texts,
      encoding_format: "float",
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const payload = (await response.json()) as EmbeddingResponse;

  if (!response.ok) {
    const message =
      payload.error?.message ?? `Embedding request failed (${response.status})`;
    throw new Error(message);
  }

  const vectors = payload.data?.map((item) => item.embedding) ?? [];
  if (vectors.length !== texts.length) {
    throw new Error("Embedding response count mismatch");
  }

  for (const vector of vectors) {
    if (!vector || vector.length !== config.dimensions) {
      throw new Error(
        `Expected embedding dimension ${config.dimensions}, got ${vector?.length ?? 0}`,
      );
    }
  }

  return vectors as number[][];
}

export async function embedTexts(
  texts: string[],
  config: EmbeddingConfig,
  auth?: EmbeddingAuthContext,
): Promise<number[][]> {
  if (!isUserLlmProviderId(config.provider)) {
    throw new Error(`Invalid embedding provider: ${config.provider}`);
  }

  if (texts.length === 0) {
    return [];
  }

  const batchSize = getRagEmbedBatchSize();
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const vectors = await embedBatch(batch, config, auth);
    results.push(...vectors);
  }

  return results;
}

export async function embedQuery(
  query: string,
  config: EmbeddingConfig,
  auth?: EmbeddingAuthContext,
): Promise<number[]> {
  const [vector] = await embedTexts([query], config, auth);
  if (!vector) {
    throw new Error("Empty embedding for query");
  }
  return vector;
}
