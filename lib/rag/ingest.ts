import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { chunkMarkdown } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embed";
import {
  validateEmbeddingConfig,
} from "@/lib/rag/embedding-validation";
import type { EmbeddingConfig } from "@/lib/rag/embedding-models";
import { parseKnowledgeBaseSource } from "@/lib/rag/parse";
import type { KnowledgeBaseRow } from "@/lib/rag/types";

const KB_COLUMNS =
  "id, user_id, name, description, source_type, source_text, source_filename, source_mime, storage_path, parsed_markdown, status, error_message, embedding_provider, embedding_model, embedding_dimensions, chunk_size_tokens, chunk_overlap_tokens, created_at, updated_at";

function toEmbeddingConfig(kb: KnowledgeBaseRow): EmbeddingConfig {
  return {
    provider: kb.embedding_provider as EmbeddingConfig["provider"],
    model: kb.embedding_model,
    dimensions: kb.embedding_dimensions,
  };
}

async function markKnowledgeBaseError(
  service: SupabaseClient,
  kbId: string,
  message: string,
): Promise<void> {
  await service
    .from("knowledge_bases")
    .update({
      status: "error",
      error_message: message.slice(0, 500),
    })
    .eq("id", kbId);
}

export async function runKnowledgeBaseIngest(kbId: string): Promise<void> {
  const service = createServiceClient();

  const { data: kb, error: loadError } = await service
    .from("knowledge_bases")
    .select(KB_COLUMNS)
    .eq("id", kbId)
    .maybeSingle();

  if (loadError || !kb) {
    throw new Error(loadError?.message ?? "Knowledge base not found");
  }

  const row = kb as KnowledgeBaseRow;

  await service
    .from("knowledge_bases")
    .update({
      status: "processing",
      error_message: null,
    })
    .eq("id", kbId);

  try {
    const embeddingConfig = toEmbeddingConfig(row);
    validateEmbeddingConfig(embeddingConfig);

    const markdown = await parseKnowledgeBaseSource(row, service);
    if (!markdown.trim()) {
      throw new Error("Parsed document is empty");
    }

    const chunks = chunkMarkdown(markdown, {
      maxTokens: row.chunk_size_tokens,
      overlapTokens: row.chunk_overlap_tokens,
    });

    if (chunks.length === 0) {
      throw new Error("No chunks produced from document");
    }

    const embeddings = await embedTexts(
      chunks.map((chunk) => chunk.content),
      embeddingConfig,
      { userId: row.user_id },
    );

    await service.from("knowledge_base_chunks").delete().eq("kb_id", kbId);

    const insertRows = chunks.map((chunk, index) => ({
      kb_id: kbId,
      chunk_index: chunk.chunkIndex,
      content: chunk.content,
      heading_path: chunk.headingPath,
      char_start: chunk.charStart,
      char_end: chunk.charEnd,
      embedding: JSON.stringify(embeddings[index]),
    }));

    const { error: insertError } = await service
      .from("knowledge_base_chunks")
      .insert(insertRows);

    if (insertError) {
      throw new Error(insertError.message);
    }

    const { error: readyError } = await service
      .from("knowledge_bases")
      .update({
        status: "ready",
        parsed_markdown: markdown,
        error_message: null,
      })
      .eq("id", kbId);

    if (readyError) {
      throw new Error(readyError.message);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Knowledge base ingest failed";
    await markKnowledgeBaseError(service, kbId, message);
    throw error;
  }
}
