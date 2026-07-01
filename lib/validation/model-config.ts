import { isUserLlmProviderId } from "@/lib/llm/provider";
import { USER_LLM_PROVIDER_IDS } from "@/lib/constants/model-providers";
import {
  isModelTypeId,
  MODEL_TYPE_IDS,
  type ModelTypeId,
} from "@/lib/constants/model-types";
import { DEFAULT_RAG_EMBEDDING_DIMENSIONS } from "@/lib/rag/defaults";

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

export function validateModelType(value: unknown): string | null {
  if (typeof value !== "string" || !isModelTypeId(value)) {
    return "Invalid model type";
  }
  return null;
}

export function parseCreateModelBody(body: {
  provider?: unknown;
  modelName?: unknown;
  apiKey?: unknown;
  modelType?: unknown;
  embeddingDimensions?: unknown;
}): {
  fields?: {
    provider: string;
    modelName: string;
    apiKey: string;
    modelType: ModelTypeId;
    embeddingDimensions: number | null;
  };
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

  const modelTypeRaw =
    body.modelType == null || body.modelType === ""
      ? "chat"
      : body.modelType;
  const modelTypeError = validateModelType(modelTypeRaw);
  if (modelTypeError) {
    return { error: modelTypeError };
  }
  const modelType = modelTypeRaw as ModelTypeId;

  let embeddingDimensions: number | null = null;
  if (modelType === "embedding") {
    const raw =
      body.embeddingDimensions ?? DEFAULT_RAG_EMBEDDING_DIMENSIONS;
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 64 || raw > 8192) {
      return { error: "Invalid embedding dimensions" };
    }
    embeddingDimensions = raw;
  }

  return {
    fields: {
      provider: body.provider as string,
      modelName: body.modelName.trim(),
      apiKey: body.apiKey.trim(),
      modelType,
      embeddingDimensions,
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
  modelType?: unknown;
  embeddingDimensions?: unknown;
}): {
  fields?: {
    provider?: string;
    modelName?: string;
    modelType?: ModelTypeId;
    embeddingDimensions?: number | null;
  };
  error?: string;
} {
  const fields: {
    provider?: string;
    modelName?: string;
    modelType?: ModelTypeId;
    embeddingDimensions?: number | null;
  } = {};

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

  if ("modelType" in body) {
    const modelTypeError = validateModelType(body.modelType);
    if (modelTypeError) {
      return { error: modelTypeError };
    }
    fields.modelType = body.modelType as ModelTypeId;
  }

  if ("embeddingDimensions" in body) {
    const raw = body.embeddingDimensions;
    if (raw == null) {
      fields.embeddingDimensions = null;
    } else if (
      typeof raw !== "number" ||
      !Number.isInteger(raw) ||
      raw < 64 ||
      raw > 8192
    ) {
      return { error: "Invalid embedding dimensions" };
    } else {
      fields.embeddingDimensions = raw;
    }
  }

  if (
    !fields.provider &&
    !fields.modelName &&
    !fields.modelType &&
    !("embeddingDimensions" in body)
  ) {
    return { error: "No fields to update" };
  }

  return { fields };
}

export { MODEL_TYPE_IDS };
