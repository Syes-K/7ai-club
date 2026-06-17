import type { UIMessage } from "ai";
import { DEFAULT_CONVERSATION_TITLE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { DbMessage } from "@/lib/data/types";
import { throwIfError } from "@/lib/data/errors";

export function dbMessageToUIMessage(message: DbMessage): UIMessage {
  return {
    id: message.id,
    role: message.role === "system" ? "assistant" : message.role,
    parts: [{ type: "text", text: message.content }],
  };
}

export async function listMessages(conversationId: string): Promise<UIMessage[]> {
  const supabase = createClient();
  // Switching chats hits this query — the only Supabase request on the hot path.
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  throwIfError(error);
  return (data as DbMessage[]).map(dbMessageToUIMessage);
}

export async function clearConversationMessages(
  conversationId: string,
): Promise<boolean> {
  const supabase = createClient();

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle();

  throwIfError(convError);
  if (!conversation) {
    return false;
  }

  const { error: deleteError } = await supabase
    .from("messages")
    .delete()
    .eq("conversation_id", conversationId);

  throwIfError(deleteError);

  const { error: updateError } = await supabase
    .from("conversations")
    .update({ title: DEFAULT_CONVERSATION_TITLE })
    .eq("id", conversationId);

  throwIfError(updateError);
  return true;
}
