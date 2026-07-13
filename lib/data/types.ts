import type { UIMessage } from "ai";
import type { UserLlmProviderId } from "@/lib/llm/provider";
import type { ModelTypeId } from "@/lib/constants/model-types";

export type DbMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  summarized_at?: string | null;
};

export type DbMessageWithArchive = DbMessage & {
  summarized_at: string | null;
};

export type ConversationSummary = {
  id: string;
  title: string;
  updated_at: string;
  assistant_name: string;
  assistant_icon: string | null;
  assistant_model: string;
};

export type ConversationSession = {
  conversationId: string;
  messages: UIMessage[];
  assistantName: string;
  assistantIcon: string | null;
  modelLabel: string;
};

export type AssistantRow = {
  id: string;
  name: string;
  icon: string | null;
  opening_message: string | null;
  system_prompt: string;
  model: string;
  user_id: string | null;
  updated_at: string;
};

export type AssistantDto = {
  id: string;
  icon: string | null;
  name: string;
  openingMessage: string | null;
  systemPrompt: string;
  updatedAt: string;
  knowledgeBaseIds: string[];
};

export type AssistantOption = {
  id: string;
  icon: string | null;
  name: string;
  isPlatform?: boolean;
};

export type UserProfile = {
  user_id: string;
  nickname: string | null;
  preferred_model_config_id: string | null;
  summarization_enabled: boolean;
  summary_trigger_turns: number;
  summary_retain_turns: number;
  summary_trigger_tokens: number;
  summary_retain_tokens: number;
  summary_model_config_id: string | null;
  rag_confidence_threshold: number;
  rag_top_k: number;
  rag_embedding_provider: string;
  rag_embedding_model: string;
  rag_query_optimize_enabled: boolean;
};

export type ModelConfigRow = {
  id: string;
  user_id: string;
  provider: UserLlmProviderId;
  model_name: string;
  model_type: ModelTypeId;
  embedding_dimensions: number | null;
  test_status: "untested" | "passed" | "failed";
  tested_at: string | null;
  test_error: string | null;
  api_key_set: boolean;
  created_at: string;
  updated_at: string;
};

export type ModelConfigDto = {
  id: string;
  provider: UserLlmProviderId;
  modelName: string;
  modelType: ModelTypeId;
  embeddingDimensions: number | null;
  providerLabel: string;
  modelTypeLabel: string;
  testStatus: "untested" | "passed" | "failed";
  testedAt: string | null;
  testError: string | null;
  apiKeySet: boolean;
  /** Platform-managed row (from `platform_model_configs`). */
  isPlatformDefault: boolean;
  /** Console UI: hide edit/delete/test for platform rows. */
  readOnly?: boolean;
  displayName?: string | null;
  /** Admin UI: platform row enabled flag. */
  enabled?: boolean;
};

export type ModelConfigOption = {
  id: string;
  label: string;
  isPlatform?: boolean;
};

export type EmbeddingModelOption = {
  key: string;
  provider: string;
  model: string;
  label: string;
  dimensions: number;
  isPlatformDefault: boolean;
};

export type ProfileDto = {
  email: string;
  nickname: string | null;
  preferredModelConfigId: string | null;
  preferredLabel: string;
  modelOptions: ModelConfigOption[];
  summarizationEnabled: boolean;
  summaryTriggerTurns: number;
  summaryRetainTurns: number;
  summaryTriggerTokens: number;
  summaryRetainTokens: number;
  summaryModelConfigId: string | null;
  summaryModelLabel: string;
  ragConfidenceThreshold: number;
  ragTopK: number;
  ragEmbeddingProvider: string;
  ragEmbeddingModel: string;
  ragEmbeddingLabel: string;
  ragQueryOptimizeEnabled: boolean;
  embeddingModelOptions: EmbeddingModelOption[];
};

export type KnowledgeBaseListItem = {
  id: string;
  name: string;
  description: string | null;
  source_type: "text" | "file";
  source_filename: string | null;
  status: "processing" | "ready" | "error";
  error_message: string | null;
  updated_at: string;
};
