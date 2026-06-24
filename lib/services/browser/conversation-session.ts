import {
  createConversationWithOpening,
  deleteConversation as deleteConversationRow,
  getConversationSummaryById,
  listConversations,
} from "@/lib/data/browser/conversations";
import { listMessages } from "@/lib/data/browser/messages";
import {
  formatModelConfigLabel,
  PLATFORM_DEFAULT_MODEL_NAME,
  PLATFORM_DEFAULT_PROVIDER,
} from "@/lib/constants/model-providers";
import type { ConversationSession, ConversationSummary } from "@/lib/data/types";
import type { UIMessage } from "ai";

export async function listConversationSummaries(): Promise<ConversationSummary[]> {
  return listConversations();
}

export type SessionLoadContext = {
  /** From sidebar list when switching chats — avoids extra metadata queries. */
  summary?: ConversationSummary | null;
  /** From layout — avoids re-fetching user_profiles on every switch. */
  preferredModelLabel?: string;
};

function buildSession(
  conversationId: string,
  messages: UIMessage[],
  summary: Pick<
    ConversationSummary,
    "assistant_name" | "assistant_icon" | "assistant_model"
  >,
  preferredModelLabel: string,
): ConversationSession {
  return {
    conversationId,
    messages,
    assistantName: summary.assistant_name,
    assistantIcon: summary.assistant_icon,
    modelLabel: preferredModelLabel,
  };
}

export async function loadConversationSession(
  conversationId: string,
  context: SessionLoadContext = {},
): Promise<ConversationSession> {
  const preferredModelLabel =
    context.preferredModelLabel ??
    formatModelConfigLabel(PLATFORM_DEFAULT_PROVIDER, PLATFORM_DEFAULT_MODEL_NAME);
  const summary =
    context.summary?.id === conversationId ? context.summary : null;

  if (summary) {
    const messages = await listMessages(conversationId);
    return buildSession(conversationId, messages, summary, preferredModelLabel);
  }

  const [messages, fetchedSummary] = await Promise.all([
    listMessages(conversationId),
    getConversationSummaryById(conversationId),
  ]);

  if (!fetchedSummary) {
    throw new Error("Conversation not found");
  }

  return buildSession(
    conversationId,
    messages,
    fetchedSummary,
    preferredModelLabel,
  );
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
