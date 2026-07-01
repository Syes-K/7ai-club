import type { SupabaseClient } from "@supabase/supabase-js";
import { getRagChunkOverlapTokens, getRagChunkSizeTokens } from "@/lib/rag/config";
import { KB_STORAGE_BUCKET } from "@/lib/rag/defaults";
import { scheduleKnowledgeBaseIngest } from "@/lib/rag/schedule-ingest";
import type { KnowledgeBaseRow } from "@/lib/rag/types";
import { createServiceClient } from "@/lib/supabase/service";

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").slice(0, 180);
}

type KnowledgeBaseSourceRow = Pick<
  KnowledgeBaseRow,
  "id" | "source_type" | "storage_path"
>;

export class KnowledgeBaseBusyError extends Error {
  constructor() {
    super("Ingest already in progress");
    this.name = "KnowledgeBaseBusyError";
  }
}

export class KnowledgeBaseSourceTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KnowledgeBaseSourceTypeError";
  }
}

async function assertCanReplaceSource(
  supabase: SupabaseClient,
  kbId: string,
  expectedSourceType: "text" | "file",
): Promise<KnowledgeBaseSourceRow> {
  const { data: kb, error } = await supabase
    .from("knowledge_bases")
    .select("id, source_type, storage_path, status")
    .eq("id", kbId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!kb) {
    throw new Error("Knowledge base not found");
  }

  if (kb.status === "processing") {
    throw new KnowledgeBaseBusyError();
  }

  if (kb.source_type !== expectedSourceType) {
    throw new KnowledgeBaseSourceTypeError(
      expectedSourceType === "text"
        ? "This knowledge base uses a file source. Upload a new file instead."
        : "This knowledge base uses pasted text. Replace text instead of uploading a file.",
    );
  }

  return kb as KnowledgeBaseSourceRow & { status: string };
}

async function removeStorageObject(storagePath: string | null): Promise<void> {
  if (!storagePath) {
    return;
  }

  try {
    const service = createServiceClient();
    await service.storage.from(KB_STORAGE_BUCKET).remove([storagePath]);
  } catch (error) {
    console.error("Failed to remove knowledge base file:", error);
  }
}

export async function replaceKnowledgeBaseTextSource(
  supabase: SupabaseClient,
  userId: string,
  kbId: string,
  text: string,
): Promise<void> {
  const kb = await assertCanReplaceSource(supabase, kbId, "text");

  if (kb.storage_path) {
    await removeStorageObject(kb.storage_path);
  }

  const { error } = await supabase
    .from("knowledge_bases")
    .update({
      source_text: text,
      source_filename: null,
      source_mime: null,
      storage_path: null,
      parsed_markdown: null,
      status: "processing",
      error_message: null,
      chunk_size_tokens: getRagChunkSizeTokens(),
      chunk_overlap_tokens: getRagChunkOverlapTokens(),
    })
    .eq("id", kbId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await scheduleKnowledgeBaseIngest(kbId);
}

export async function replaceKnowledgeBaseFileSource(
  supabase: SupabaseClient,
  userId: string,
  kbId: string,
  file: File,
): Promise<void> {
  const kb = await assertCanReplaceSource(supabase, kbId, "file");
  const service = createServiceClient();
  const storagePath = `${userId}/${kbId}/${sanitizeFilename(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await service.storage
    .from(KB_STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  if (kb.storage_path && kb.storage_path !== storagePath) {
    await removeStorageObject(kb.storage_path);
  }

  const { error } = await supabase
    .from("knowledge_bases")
    .update({
      source_text: null,
      source_filename: file.name,
      source_mime: file.type || null,
      storage_path: storagePath,
      parsed_markdown: null,
      status: "processing",
      error_message: null,
      chunk_size_tokens: getRagChunkSizeTokens(),
      chunk_overlap_tokens: getRagChunkOverlapTokens(),
    })
    .eq("id", kbId)
    .eq("user_id", userId);

  if (error) {
    await service.storage.from(KB_STORAGE_BUCKET).remove([storagePath]);
    throw new Error(error.message);
  }

  await scheduleKnowledgeBaseIngest(kbId);
}
