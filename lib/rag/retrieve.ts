import type { SupabaseClient } from "@supabase/supabase-js";
import { embedQuery } from "@/lib/rag/embed";
import type { EmbeddingConfig } from "@/lib/rag/embedding-models";
import type { KnowledgeBaseBinding, RagHit } from "@/lib/rag/types";

type MatchRow = {
  kb_id: string;
  chunk_id: string;
  content: string;
  heading_path: string | null;
  char_start: number;
  char_end: number;
  similarity: number;
};

type RetrieveOptions = {
  supabase: SupabaseClient;
  userId: string;
  bindings: KnowledgeBaseBinding[];
  query: string;
  threshold: number;
  topK: number;
};

function groupBindingsByEmbedding(bindings: KnowledgeBaseBinding[]) {
  const groups = new Map<string, KnowledgeBaseBinding[]>();

  for (const binding of bindings) {
    const key = `${binding.embeddingProvider}:${binding.embeddingModel}:${binding.embeddingDimensions}`;
    const list = groups.get(key) ?? [];
    list.push(binding);
    groups.set(key, list);
  }

  return groups;
}

export async function retrieveChunks(
  options: RetrieveOptions,
): Promise<RagHit[]> {
  const { supabase, userId, bindings, query, threshold, topK } = options;
  if (bindings.length === 0 || !query.trim()) {
    return [];
  }

  const groups = groupBindingsByEmbedding(bindings);
  const allHits: RagHit[] = [];

  for (const groupBindings of groups.values()) {
    const sample = groupBindings[0];
    const embeddingConfig: EmbeddingConfig = {
      provider: sample.embeddingProvider,
      model: sample.embeddingModel,
      dimensions: sample.embeddingDimensions,
    };

    const queryVector = await embedQuery(query, embeddingConfig, { userId });
    const kbIds = groupBindings.map((binding) => binding.id);
    const nameById = new Map(
      groupBindings.map((binding) => [binding.id, binding.name]),
    );

    const { data, error } = await supabase.rpc("match_knowledge_base_chunks", {
      p_kb_ids: kbIds,
      p_query_embedding: queryVector,
      p_match_count: topK,
      p_min_score: threshold,
    });

    if (error) {
      throw new Error(error.message);
    }

    for (const row of (data ?? []) as MatchRow[]) {
      allHits.push({
        kbId: row.kb_id,
        kbName: nameById.get(row.kb_id) ?? "Knowledge base",
        chunkId: row.chunk_id,
        content: row.content,
        headingPath: row.heading_path,
        charStart: row.char_start,
        charEnd: row.char_end,
        score: row.similarity,
      });
    }
  }

  return allHits.sort((a, b) => b.score - a.score).slice(0, topK);
}

export async function retrieveBestChunk(
  options: Omit<RetrieveOptions, "threshold" | "topK">,
): Promise<RagHit | null> {
  const hits = await retrieveChunks({ ...options, threshold: 0, topK: 1 });
  return hits[0] ?? null;
}

export function formatRagContext(hits: RagHit[]): string {
  if (hits.length === 0) {
    return "";
  }

  return hits
    .map((hit) => {
      const location = hit.headingPath
        ? `[Source: ${hit.kbName} | ${hit.headingPath}]`
        : `[Source: ${hit.kbName}]`;
      return `${location}\n${hit.content}`;
    })
    .join("\n\n---\n\n");
}

export function formatRagHitsDetail(hits: RagHit[]): string {
  if (hits.length === 0) {
    return "No knowledge matched.";
  }

  return hits
    .map((hit) => {
      const location = hit.headingPath ?? `chars ${hit.charStart}-${hit.charEnd}`;
      const excerpt =
        hit.content.length > 280
          ? `${hit.content.slice(0, 280)}…`
          : hit.content;
      return `**Score:** ${hit.score.toFixed(3)} · **${hit.kbName}** · ${location}\n\n${excerpt}`;
    })
    .join("\n\n---\n\n");
}
