import { createClient } from "@/lib/supabase/client";
import type { ConversationSummary } from "@/lib/data/types";
import { throwIfError } from "@/lib/data/errors";

type ConversationRow = {
  id: string;
  title: string;
  updated_at: string;
  assistants:
    | { name: string; icon: string | null; model: string }
    | { name: string; icon: string | null; model: string }[]
    | null;
};

function mapConversationRow(row: ConversationRow): ConversationSummary {
  const assistant = row.assistants;
  const assistantRow = Array.isArray(assistant) ? assistant[0] : assistant;

  return {
    id: row.id,
    title: row.title,
    updated_at: row.updated_at,
    assistant_name: assistantRow?.name ?? "7ai Assistant",
    assistant_icon: assistantRow?.icon ?? null,
    assistant_model: assistantRow?.model ?? "",
  };
}

const CONVERSATION_SUMMARY_SELECT =
  "id, title, updated_at, assistants(name, icon, model)";

export async function listConversations(): Promise<ConversationSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SUMMARY_SELECT)
    .order("updated_at", { ascending: false })
    .limit(50);

  throwIfError(error);
  return (data as ConversationRow[]).map(mapConversationRow);
}

export async function getConversationSummaryById(
  conversationId: string,
): Promise<ConversationSummary | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SUMMARY_SELECT)
    .eq("id", conversationId)
    .maybeSingle();

  throwIfError(error);
  if (!data) return null;
  return mapConversationRow(data as ConversationRow);
}

export async function deleteConversation(conversationId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .select("id")
    .maybeSingle();

  throwIfError(error);
  return data != null;
}

export async function createConversationWithOpening(
  assistantId: string,
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_conversation_with_opening", {
    p_assistant_id: assistantId,
  });

  throwIfError(error);

  if (typeof data !== "string") {
    throw new Error("Failed to create conversation");
  }

  return data;
}
