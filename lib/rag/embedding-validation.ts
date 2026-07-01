import { isUserLlmProviderId } from "@/lib/llm/provider";
import {
  getDefaultEmbeddingConfig,
  type EmbeddingConfig,
} from "@/lib/rag/embedding-models";
import { DEFAULT_RAG_EMBEDDING_DIMENSIONS } from "@/lib/rag/defaults";

export type EmbeddingAuthContext = {
  userId: string;
};

export function validateEmbeddingConfig(config: EmbeddingConfig): void {
  if (!isUserLlmProviderId(config.provider)) {
    throw new Error(`Invalid embedding provider: ${config.provider}`);
  }
  if (!config.model.trim()) {
    throw new Error("Embedding model name is required");
  }
  if (
    !Number.isInteger(config.dimensions) ||
    config.dimensions < 64 ||
    config.dimensions > 8192
  ) {
    throw new Error(`Invalid embedding dimensions: ${config.dimensions}`);
  }
}

export function isPlatformDefaultEmbeddingConfig(
  config: Pick<EmbeddingConfig, "provider" | "model">,
): boolean {
  const defaults = getDefaultEmbeddingConfig();
  return (
    config.provider === defaults.provider && config.model === defaults.model
  );
}

export function resolveEmbeddingDimensionsFromConfig(
  config: Pick<EmbeddingConfig, "provider" | "model" | "dimensions">,
): number {
  if (config.dimensions) {
    return config.dimensions;
  }
  const defaults = getDefaultEmbeddingConfig();
  if (
    config.provider === defaults.provider &&
    config.model === defaults.model
  ) {
    return defaults.dimensions;
  }
  return DEFAULT_RAG_EMBEDDING_DIMENSIONS;
}

/** @deprecated use validateEmbeddingConfig */
export function assertSupportedEmbeddingConfig(config: EmbeddingConfig): void {
  validateEmbeddingConfig(config);
}
