import type { ChatProviderId } from "@/lib/chat/types";

/** 内置默认值（与 JSON 合并；文件缺失或损坏时回退） */
export type AppConfig = {
  maxMessagesInContext: number;
  defaultProvider: ChatProviderId;
  /** 智谱 model id，须在 ZHIPU_MODEL_IDS 内 */
  defaultModel: string;
  chatLoggingEnabled: boolean;
  appDisplayName: string;
  /** 是否启用会话级上下文摘要（窗口外前缀压缩） */
  contextSummaryEnabled: boolean;
  /** 摘要正文最大字符数（写入模型前截断） */
  contextSummaryMaxChars: number;
  /**
   * 自上次成功摘要以来，持久化消息条数至少增加多少条再触发下一次摘要刷新。
   * 与 `maxMessagesInContext` 独立；间隔内摘要可能相对当前 n 略滞后（见设计文档）。
   */
  contextSummaryRefreshEvery: number;
};

export const FALLBACK_DEFAULTS: AppConfig = {
  maxMessagesInContext: 40,
  defaultProvider: "zhipu",
  defaultModel: "glm-4-flash",
  chatLoggingEnabled: true,
  appDisplayName: "AI 对话",
  contextSummaryEnabled: false,
  contextSummaryMaxChars: 4000,
  contextSummaryRefreshEvery: 8,
};
