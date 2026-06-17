import type { UIMessage } from "ai";

export type ConversationSession = {
  conversationId: string;
  messages: UIMessage[];
  assistantName: string;
  assistantIcon: string | null;
  modelLabel: string;
};

export async function fetchConversationSession(
  conversationId: string,
): Promise<ConversationSession> {
  const res = await fetch(`/api/conversations/${conversationId}/session`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body.error === "string" ? body.error : "Failed to load conversation",
    );
  }

  return res.json() as Promise<ConversationSession>;
}
