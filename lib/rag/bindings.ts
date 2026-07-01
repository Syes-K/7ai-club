import type { SupabaseClient } from "@supabase/supabase-js";
import { isUserLlmProviderId } from "@/lib/llm/provider";
import type { KnowledgeBaseBinding } from "@/lib/rag/types";

type BindingRow = {
  kb_id: string;
  knowledge_bases: {
    id: string;
    name: string;
    status: string;
    embedding_provider: string;
    embedding_model: string;
    embedding_dimensions: number;
  };
};

export async function loadAssistantKnowledgeBaseBindings(
  assistantId: string,
  supabase: SupabaseClient,
): Promise<KnowledgeBaseBinding[]> {
  const { data, error } = await supabase
    .from("assistant_knowledge_bases")
    .select(
      "kb_id, knowledge_bases!inner(id, name, status, embedding_provider, embedding_model, embedding_dimensions)",
    )
    .eq("assistant_id", assistantId);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as BindingRow[])
    .filter((row) => row.knowledge_bases.status === "ready")
    .flatMap((row) => {
      const provider = row.knowledge_bases.embedding_provider;
      if (!isUserLlmProviderId(provider)) {
        return [];
      }
      return [
        {
          id: row.knowledge_bases.id,
          name: row.knowledge_bases.name,
          embeddingProvider: provider,
          embeddingModel: row.knowledge_bases.embedding_model,
          embeddingDimensions: row.knowledge_bases.embedding_dimensions,
        } satisfies KnowledgeBaseBinding,
      ];
    });
}
