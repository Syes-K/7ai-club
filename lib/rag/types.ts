import type { UserLlmProviderId } from "@/lib/llm/provider";

export type KnowledgeBaseStatus = "processing" | "ready" | "error";
export type KnowledgeBaseSourceType = "text" | "file";

export type KnowledgeBaseRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  source_type: KnowledgeBaseSourceType;
  source_text: string | null;
  source_filename: string | null;
  source_mime: string | null;
  storage_path: string | null;
  parsed_markdown: string | null;
  status: KnowledgeBaseStatus;
  error_message: string | null;
  embedding_provider: string;
  embedding_model: string;
  embedding_dimensions: number;
  chunk_size_tokens: number;
  chunk_overlap_tokens: number;
  created_at: string;
  updated_at: string;
};

export type ChunkDraft = {
  chunkIndex: number;
  content: string;
  headingPath: string | null;
  charStart: number;
  charEnd: number;
};

export type RagHit = {
  kbId: string;
  kbName: string;
  chunkId: string;
  content: string;
  headingPath: string | null;
  charStart: number;
  charEnd: number;
  score: number;
};

export type KnowledgeBaseBinding = {
  id: string;
  name: string;
  embeddingProvider: UserLlmProviderId;
  embeddingModel: string;
  embeddingDimensions: number;
};
