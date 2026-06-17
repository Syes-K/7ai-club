import type { UIMessage } from "ai";

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
};

export type AssistantOption = {
  id: string;
  icon: string | null;
  name: string;
};

export type UserProfile = {
  user_id: string;
  nickname: string | null;
  preferred_model: string | null;
};

export type ProfileDto = {
  email: string;
  nickname: string | null;
  preferredModel: string | null;
  modelOptions: { id: string; label: string }[];
};
