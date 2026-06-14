export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { ChatLayout } from "@/components/chat/chat-layout";
import {
  getAssistantForConversation,
  getConversationForUser,
  listConversations,
  loadMessages,
} from "@/lib/chat/conversations";
import { getLlmDisplayLabel } from "@/lib/llm/provider";
import { createClient } from "@/lib/supabase/server";

interface ChatConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ChatConversationPage({
  params,
}: ChatConversationPageProps) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const conversation = await getConversationForUser(conversationId, user.id);
  if (!conversation) {
    notFound();
  }

  const [messages, conversations, assistant] = await Promise.all([
    loadMessages(conversationId),
    listConversations(user.id),
    getAssistantForConversation(conversationId),
  ]);

  return (
    <ChatLayout
      conversationId={conversationId}
      initialMessages={messages}
      conversations={conversations}
      modelLabel={getLlmDisplayLabel(assistant.model)}
    />
  );
}
