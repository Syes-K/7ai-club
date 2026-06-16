import type { UIMessage } from "ai";
import { DEFAULT_CONVERSATION_TITLE, TITLE_MAX_LENGTH } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export type DbMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  updated_at: string;
  assistant_name: string;
};

export function getTextFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function dbMessageToUIMessage(message: DbMessage): UIMessage {
  return {
    id: message.id,
    role: message.role === "system" ? "assistant" : message.role,
    parts: [{ type: "text", text: message.content }],
  };
}

export async function loadMessages(conversationId: string): Promise<UIMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbMessage[]).map(dbMessageToUIMessage);
}

export async function saveUserMessage(
  conversationId: string,
  message: UIMessage,
): Promise<void> {
  const supabase = await createClient();
  const content = getTextFromUIMessage(message);

  if (!content.trim()) {
    throw new Error("Empty message");
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveAssistantMessage(
  conversationId: string,
  message: UIMessage,
): Promise<void> {
  const supabase = await createClient();
  const content = getTextFromUIMessage(message);

  if (!content.trim()) {
    return;
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function maybeUpdateConversationTitle(
  conversationId: string,
  userText: string,
): Promise<void> {
  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from("conversations")
    .select("title")
    .eq("id", conversationId)
    .single();

  if (!conversation || conversation.title !== DEFAULT_CONVERSATION_TITLE) {
    return;
  }

  const title = userText.trim().slice(0, TITLE_MAX_LENGTH) || DEFAULT_CONVERSATION_TITLE;

  await supabase
    .from("conversations")
    .update({ title })
    .eq("id", conversationId);
}

export async function listConversations(
  userId: string,
): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, updated_at, assistants(name)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const assistant = row.assistants as { name: string } | { name: string }[] | null;
    const assistantName = Array.isArray(assistant)
      ? assistant[0]?.name
      : assistant?.name;

    return {
      id: row.id,
      title: row.title,
      updated_at: row.updated_at,
      assistant_name: assistantName ?? "7ai Assistant",
    };
  });
}

export async function getConversationForUser(
  conversationId: string,
  userId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, user_id, assistant_id, title")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getDefaultAssistant() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assistants")
    .select("id, name, system_prompt, model")
    .eq("is_default", true)
    .single();

  if (error || !data) {
    throw new Error(
      "Default assistant not found. Run supabase/migrations/20260614000000_mvp_chat.sql in Supabase SQL Editor.",
    );
  }

  return data;
}

export async function createConversation(userId: string) {
  const supabase = await createClient();
  const assistant = await getDefaultAssistant();

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      assistant_id: assistant.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create conversation");
  }

  return data.id as string;
}

export async function getLatestConversationId(
  userId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

export async function deleteConversation(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data != null;
}

export async function clearConversationMessages(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const conversation = await getConversationForUser(conversationId, userId);
  if (!conversation) {
    return false;
  }

  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("messages")
    .delete()
    .eq("conversation_id", conversationId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: updateError } = await supabase
    .from("conversations")
    .update({ title: DEFAULT_CONVERSATION_TITLE })
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return true;
}

export async function getAssistantForConversation(conversationId: string) {
  const supabase = await createClient();
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("assistant_id")
    .eq("id", conversationId)
    .single();

  if (convError || !conversation) {
    throw new Error("Conversation not found");
  }

  const { data: assistant, error: assistantError } = await supabase
    .from("assistants")
    .select("id, name, system_prompt, model")
    .eq("id", conversation.assistant_id)
    .single();

  if (assistantError || !assistant) {
    throw new Error("Assistant not found for conversation");
  }

  return assistant;
}
