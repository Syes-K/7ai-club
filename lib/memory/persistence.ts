import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbMessageWithArchive } from "@/lib/data/types";
import type { MemorySummaryRow } from "@/lib/memory/types";
import { estimateTextTokens } from "@/lib/memory/token-estimate";

export async function loadDbMessagesWithArchive(
  conversationId: string,
  supabase: SupabaseClient,
): Promise<DbMessageWithArchive[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, role, content, created_at, summarized_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DbMessageWithArchive[];
}

export async function getMemorySummary(
  conversationId: string,
  supabase: SupabaseClient,
): Promise<MemorySummaryRow | null> {
  const { data, error } = await supabase
    .from("conversation_memory_summaries")
    .select("content, token_estimate, updated_at")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as MemorySummaryRow | null) ?? null;
}

export async function upsertMemorySummary(
  conversationId: string,
  content: string,
  supabase: SupabaseClient,
): Promise<MemorySummaryRow> {
  const token_estimate = estimateTextTokens(content);

  const { data, error } = await supabase
    .from("conversation_memory_summaries")
    .upsert(
      {
        conversation_id: conversationId,
        content,
        token_estimate,
      },
      { onConflict: "conversation_id" },
    )
    .select("content, token_estimate, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save memory summary");
  }

  return data as MemorySummaryRow;
}

export async function markMessagesSummarized(
  messageIds: string[],
  supabase: SupabaseClient,
  summarizedAt: string = new Date().toISOString(),
): Promise<void> {
  if (messageIds.length === 0) {
    return;
  }

  const { data, error } = await supabase
    .from("messages")
    .update({ summarized_at: summarizedAt })
    .in("id", messageIds)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  if ((data ?? []).length !== messageIds.length) {
    throw new Error("Failed to archive summarized messages");
  }
}

export async function clearConversationMemory(
  conversationId: string,
  supabase: SupabaseClient,
): Promise<void> {
  const { error: summaryError } = await supabase
    .from("conversation_memory_summaries")
    .delete()
    .eq("conversation_id", conversationId);

  if (summaryError) {
    throw new Error(summaryError.message);
  }
}
