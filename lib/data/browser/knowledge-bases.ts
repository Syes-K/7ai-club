import { createClient } from "@/lib/supabase/client";
import type { KnowledgeBaseListItem } from "@/lib/data/types";
import { DataError, throwIfError } from "@/lib/data/errors";

const LIST_COLUMNS =
  "id, name, description, source_type, source_filename, status, error_message, updated_at";

export async function listKnowledgeBases(): Promise<KnowledgeBaseListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("knowledge_bases")
    .select(LIST_COLUMNS)
    .order("updated_at", { ascending: false });

  throwIfError(error);
  return (data ?? []) as KnowledgeBaseListItem[];
}

export async function getKnowledgeBaseById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("knowledge_bases")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwIfError(error);
  return data;
}

export type KnowledgeBaseChunkItem = {
  chunk_index: number;
  content: string;
  heading_path: string | null;
  char_start: number;
  char_end: number;
};

export async function listKnowledgeBaseChunks(
  kbId: string,
): Promise<KnowledgeBaseChunkItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("knowledge_base_chunks")
    .select("chunk_index, content, heading_path, char_start, char_end")
    .eq("kb_id", kbId)
    .order("chunk_index", { ascending: true });

  throwIfError(error);
  return (data ?? []) as KnowledgeBaseChunkItem[];
}

export async function getKnowledgeBaseChunkCount(kbId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("knowledge_base_chunks")
    .select("*", { count: "exact", head: true })
    .eq("kb_id", kbId);

  throwIfError(error);
  return count ?? 0;
}

export async function listReadyKnowledgeBaseOptions(): Promise<
  Array<{ id: string; name: string }>
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("knowledge_bases")
    .select("id, name")
    .eq("status", "ready")
    .order("name", { ascending: true });

  throwIfError(error);
  return (data ?? []) as Array<{ id: string; name: string }>;
}

export async function getAssistantKnowledgeBaseIds(
  assistantId: string,
): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("assistant_knowledge_bases")
    .select("kb_id")
    .eq("assistant_id", assistantId);

  throwIfError(error);
  return (data ?? []).map((row) => row.kb_id as string);
}

export async function setAssistantKnowledgeBases(
  assistantId: string,
  kbIds: string[],
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("set_assistant_knowledge_bases", {
    p_assistant_id: assistantId,
    p_kb_ids: kbIds,
  });

  if (error) {
    throw new DataError(error.message, error.code);
  }
}

export async function deleteKnowledgeBase(id: string): Promise<void> {
  const response = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
  if (response.status === 409) {
    throw new Error(await response.text());
  }
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function retryKnowledgeBaseIngest(id: string): Promise<void> {
  const response = await fetch(`/api/knowledge/${id}/ingest`, { method: "POST" });
  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export type RecallTestResult = {
  hits: Array<{
    score: number;
    content: string;
    headingPath: string | null;
    charStart: number;
    charEnd: number;
  }>;
  meta: {
    originalQuery: string;
    optimizedQuery: string;
    queryOptimized: boolean;
    threshold: number;
    topK: number;
    profileThreshold: number;
    profileTopK: number;
    bestBelowThreshold: {
      score: number;
      content: string;
      headingPath: string | null;
    } | null;
  };
};

export async function runKnowledgeBaseRecallTest(
  id: string,
  options: {
    query: string;
    confidenceThreshold?: number;
    topK?: number;
  },
): Promise<RecallTestResult> {
  const response = await fetch(`/api/knowledge/${id}/recall-test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as RecallTestResult;
}

export async function updateKnowledgeBaseMeta(
  id: string,
  fields: { name?: string; description?: string | null },
): Promise<void> {
  const response = await fetch(`/api/knowledge/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function replaceKnowledgeBaseTextSource(
  id: string,
  text: string,
): Promise<void> {
  const response = await fetch(`/api/knowledge/${id}/source`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function replaceKnowledgeBaseFileSource(
  id: string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch(`/api/knowledge/${id}/source`, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export async function createTextKnowledgeBase(body: {
  name: string;
  description?: string | null;
  text: string;
}): Promise<{ id: string }> {
  const response = await fetch("/api/knowledge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: body.name,
      description: body.description ?? null,
      sourceType: "text",
      text: body.text,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as { id: string };
}

export async function createFileKnowledgeBase(formData: FormData): Promise<{ id: string }> {
  const response = await fetch("/api/knowledge", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as { id: string };
}
