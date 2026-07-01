import {
  DEFAULT_RAG_CHUNK_OVERLAP,
  DEFAULT_RAG_CHUNK_SIZE,
  DEFAULT_RAG_EMBED_BATCH_SIZE,
} from "@/lib/rag/defaults";

export function getRagChunkSizeTokens(): number {
  const raw = process.env.RAG_CHUNK_SIZE?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_RAG_CHUNK_SIZE;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RAG_CHUNK_SIZE;
}

export function getRagChunkOverlapTokens(): number {
  const raw = process.env.RAG_CHUNK_OVERLAP?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_RAG_CHUNK_OVERLAP;
  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_RAG_CHUNK_OVERLAP;
}

export function getRagEmbedBatchSize(): number {
  const raw = process.env.RAG_EMBED_BATCH_SIZE?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_RAG_EMBED_BATCH_SIZE;
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_RAG_EMBED_BATCH_SIZE;
}
