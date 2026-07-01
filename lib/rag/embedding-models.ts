import type { UserLlmProviderId } from "@/lib/llm/provider";
import {
  DEFAULT_RAG_EMBEDDING_DIMENSIONS,
  DEFAULT_RAG_EMBEDDING_MODEL,
  DEFAULT_RAG_EMBEDDING_PROVIDER,
} from "@/lib/rag/defaults";

export type EmbeddingConfig = {
  provider: UserLlmProviderId;
  model: string;
  dimensions: number;
};

export function getDefaultEmbeddingConfig(): EmbeddingConfig {
  const provider = (process.env.RAG_EMBEDDING_PROVIDER?.trim() ||
    DEFAULT_RAG_EMBEDDING_PROVIDER) as UserLlmProviderId;

  return {
    provider,
    model:
      process.env.RAG_EMBEDDING_MODEL?.trim() || DEFAULT_RAG_EMBEDDING_MODEL,
    dimensions: Number(
      process.env.RAG_EMBEDDING_DIMENSIONS?.trim() ||
        String(DEFAULT_RAG_EMBEDDING_DIMENSIONS),
    ),
  };
}

export function getEmbeddingModelLabel(config: EmbeddingConfig): string {
  const defaults = getDefaultEmbeddingConfig();
  if (
    config.provider === defaults.provider &&
    config.model === defaults.model
  ) {
    return `Platform default — ${defaults.provider} — ${defaults.model}`;
  }
  return `${config.provider} — ${config.model}`;
}
