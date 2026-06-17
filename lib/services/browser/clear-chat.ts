import { clearConversationMessages } from "@/lib/data/browser/messages";

export async function clearChat(conversationId: string): Promise<void> {
  const cleared = await clearConversationMessages(conversationId);
  if (!cleared) {
    throw new Error("Failed to clear chat");
  }
}
