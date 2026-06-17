import {
  createConversationWithOpening,
  deleteConversation as deleteConversationRow,
  getConversationSummaryById,
  listConversations,
} from "@/lib/data/browser/conversations";
import { listMessages } from "@/lib/data/browser/messages";
import type { ConversationSession, ConversationSummary } from "@/lib/data/types";
import { getDisplayModelLabel } from "@/lib/services/browser/model-label";
import type { UIMessage } from "ai";

export async function listConversationSummaries(): Promise<ConversationSummary[]> {
  return listConversations();
}

export type SessionLoadContext = {
  /** From sidebar list when switching chats — avoids extra metadata queries. */
  summary?: ConversationSummary | null;
  /** From layout — avoids re-fetching user_profiles on every switch. */
  preferredModel?: string | null;
};

function buildSession(
  conversationId: string,
  messages: UIMessage[],
  summary: Pick<
    ConversationSummary,
    "assistant_name" | "assistant_icon" | "assistant_model"
  >,
  preferredModel?: string | null,
): ConversationSession {
  return {
    conversationId,
    messages,
    assistantName: summary.assistant_name,
    assistantIcon: summary.assistant_icon,
    modelLabel: getDisplayModelLabel(summary.assistant_model, preferredModel),
  };
}

export async function loadConversationSession(
  conversationId: string,
  context: SessionLoadContext = {},
): Promise<ConversationSession> {
  const { preferredModel } = context;
  const summary =
    context.summary?.id === conversationId ? context.summary : null;

  if (summary) {
    // Sidebar switch: 1 network request — messages only (Network tab: /rest/v1/messages).
    const messages = await listMessages(conversationId);
    return buildSession(conversationId, messages, summary, preferredModel);
  }

  // Cold URL / list not ready: messages + one conversations join (no profile/assistant round-trips).
  const [messages, fetchedSummary] = await Promise.all([
    listMessages(conversationId),
    getConversationSummaryById(conversationId),
  ]);

  if (!fetchedSummary) {
    throw new Error("Conversation not found");
  }

  return buildSession(conversationId, messages, fetchedSummary, preferredModel);
}

export async function createConversation(assistantId: string): Promise<string> {
  return createConversationWithOpening(assistantId);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const deleted = await deleteConversationRow(conversationId);
  if (!deleted) {
    throw new Error("Failed to delete conversation");
  }
}
