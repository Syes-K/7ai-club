import {
  getAssistantForConversation,
  getConversationForUser,
  loadMessages,
} from "@/lib/chat/conversations";
import { ensureUserProfileDefaults } from "@/lib/console/profile";
import { loadDbMessagesWithArchive } from "@/lib/memory/persistence";
import { buildLlmUiMessages } from "@/lib/memory/assemble-llm-messages";
import { loadAssistantKnowledgeBaseBindings } from "@/lib/rag/bindings";
import {
  DEFAULT_RAG_CONFIDENCE,
  DEFAULT_RAG_QUERY_OPTIMIZE_ENABLED,
  DEFAULT_RAG_TOP_K,
} from "@/lib/rag/defaults";
import type { ProfileRow, WorkflowNode } from "@/lib/workflow/types";
import type { UserProfile } from "@/lib/console/profile";

function toProfileRow(profile: UserProfile | null): ProfileRow | null {
  if (!profile) {
    return null;
  }

  return {
    preferred_model_config_id: profile.preferred_model_config_id,
    summarization_enabled: profile.summarization_enabled,
    summary_trigger_turns: profile.summary_trigger_turns,
    summary_retain_turns: profile.summary_retain_turns,
    summary_trigger_tokens: profile.summary_trigger_tokens,
    summary_retain_tokens: profile.summary_retain_tokens,
    summary_model_config_id: profile.summary_model_config_id,
    rag_confidence_threshold:
      profile.rag_confidence_threshold ?? DEFAULT_RAG_CONFIDENCE,
    rag_top_k: profile.rag_top_k ?? DEFAULT_RAG_TOP_K,
    rag_embedding_provider: profile.rag_embedding_provider ?? "siliconflow",
    rag_embedding_model: profile.rag_embedding_model ?? "BAAI/bge-m3",
    rag_query_optimize_enabled:
      profile.rag_query_optimize_enabled ?? DEFAULT_RAG_QUERY_OPTIMIZE_ENABLED,
  };
}

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
    const [previousMessages, dbMessages, assistant, profile] = await Promise.all([
      loadMessages(ctx.conversationId, ctx.supabase),
      loadDbMessagesWithArchive(ctx.conversationId, ctx.supabase),
      getAssistantForConversation(ctx.conversationId, ctx.supabase),
      ensureUserProfileDefaults(ctx.userId, ctx.supabase),
    ]);

    ctx.dbMessages = dbMessages;
    ctx.uiMessages = [...previousMessages, ctx.message];
    ctx.llmUiMessages = buildLlmUiMessages(dbMessages);
    ctx.assistant = assistant;
    ctx.profile = toProfileRow(profile);

    if (assistant?.id) {
      ctx.knowledgeBases = await loadAssistantKnowledgeBaseBindings(
        assistant.id,
        ctx.supabase,
      );
    } else {
      ctx.knowledgeBases = [];
    }

    const activeCount = ctx.llmUiMessages.length;
    const totalCount = dbMessages.length;

    if (activeCount === totalCount) {
      return `${activeCount} messages`;
    }

    return `${activeCount} active · ${totalCount} total`;
  },
};
