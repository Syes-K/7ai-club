import { isUserLlmProviderId } from "@/lib/llm/provider";
import { USER_LLM_PROVIDER_IDS } from "@/lib/constants/model-providers";

export const MODEL_NAME_MAX_LENGTH = 128;
export const API_KEY_MIN_LENGTH = 8;

export function validateModelName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Model name is required";
  }
  if (trimmed.length > MODEL_NAME_MAX_LENGTH) {
    return `Model name must be ${MODEL_NAME_MAX_LENGTH} characters or fewer`;
  }
  return null;
}

export function validateApiKey(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "API key is required";
  }
  if (trimmed.length < API_KEY_MIN_LENGTH) {
    return "API key is too short";
  }
  return null;
}

export function validateProvider(value: unknown): string | null {
  if (typeof value !== "string" || !isUserLlmProviderId(value)) {
    return "Invalid provider";
  }
  if (!USER_LLM_PROVIDER_IDS.includes(value)) {
    return "Invalid provider";
  }
  return null;
}

export function parseCreateModelBody(body: {
  provider?: unknown;
  modelName?: unknown;
  apiKey?: unknown;
}): {
  fields?: { provider: string; modelName: string; apiKey: string };
  error?: string;
} {
  const providerError = validateProvider(body.provider);
  if (providerError) {
    return { error: providerError };
  }

  if (typeof body.modelName !== "string") {
    return { error: "Model name is required" };
  }

  const modelNameError = validateModelName(body.modelName);
  if (modelNameError) {
    return { error: modelNameError };
  }

  if (typeof body.apiKey !== "string") {
    return { error: "API key is required" };
  }

  const apiKeyError = validateApiKey(body.apiKey);
  if (apiKeyError) {
    return { error: apiKeyError };
  }

  return {
    fields: {
      provider: body.provider as string,
      modelName: body.modelName.trim(),
      apiKey: body.apiKey.trim(),
    },
  };
}

export function parseUpdateModelKeyBody(body: {
  apiKey?: unknown;
}): { apiKey?: string; error?: string } {
  if (typeof body.apiKey !== "string") {
    return { error: "API key is required" };
  }

  const apiKeyError = validateApiKey(body.apiKey);
  if (apiKeyError) {
    return { error: apiKeyError };
  }

  return { apiKey: body.apiKey.trim() };
}

export function parseUpdateModelMetadataBody(body: {
  provider?: unknown;
  modelName?: unknown;
}): {
  fields?: { provider?: string; modelName?: string };
  error?: string;
} {
  const fields: { provider?: string; modelName?: string } = {};

  if ("provider" in body) {
    const providerError = validateProvider(body.provider);
    if (providerError) {
      return { error: providerError };
    }
    fields.provider = body.provider as string;
  }

  if ("modelName" in body) {
    if (typeof body.modelName !== "string") {
      return { error: "Model name is required" };
    }
    const modelNameError = validateModelName(body.modelName);
    if (modelNameError) {
      return { error: modelNameError };
    }
    fields.modelName = body.modelName.trim();
  }

  if (!fields.provider && !fields.modelName) {
    return { error: "No fields to update" };
  }

  return { fields };
}
