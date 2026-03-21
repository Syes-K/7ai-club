import type { ChatProviderId } from "@/lib/chat/types";

/** 内置默认值（与 JSON 合并；文件缺失或损坏时回退） */
export type AppConfig = {
  maxMessagesInContext: number;
  defaultProvider: ChatProviderId;
  /** 智谱 model id，须在 ZHIPU_MODEL_IDS 内 */
  defaultModel: string;
  chatLoggingEnabled: boolean;
  appDisplayName: string;
};

export const FALLBACK_DEFAULTS: AppConfig = {
  maxMessagesInContext: 40,
  defaultProvider: "zhipu",
  defaultModel: "glm-4-flash",
  chatLoggingEnabled: true,
  appDisplayName: "AI 对话",
};
