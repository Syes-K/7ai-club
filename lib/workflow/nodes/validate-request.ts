import {
  getAssistantForConversation,
  getConversationForUser,
  loadMessages,
} from "@/lib/chat/conversations";
import { getUserProfile } from "@/lib/console/profile";
import type { WorkflowNode } from "@/lib/workflow/types";

export const validateRequestNode: WorkflowNode = {
  id: "validate_request",
  label: "Validate request",
  async run(ctx) {
    const conversation = await getConversationForUser(
      ctx.conversationId,
      ctx.userId,
      ctx.supabase,
    );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    ctx.conversation = conversation;
  },
};

export const loadContextNode: WorkflowNode = {
  id: "load_context",
  label: "Load context",
  async run(ctx) {
    const [previousMessages, assistant, profile] = await Promise.all([
      loadMessages(ctx.conversationId, ctx.supabase),
      getAssistantForConversation(ctx.conversationId, ctx.supabase),
      getUserProfile(ctx.userId, ctx.supabase),
    ]);

    ctx.uiMessages = [...previousMessages, ctx.message];
    ctx.assistant = assistant;
    ctx.profile = profile;

    return `${ctx.uiMessages.length} messages`;
  },
};
