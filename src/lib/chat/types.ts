export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatProviderId = "zhipu" | "deepseek";

export type ChatRoute = {
  provider: ChatProviderId;
  /** 智谱必填具体 model；DeepSeek 使用服务端默认时可省略 */
  model?: string;
};
