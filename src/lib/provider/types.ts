export type ChatProviderId = "zhipu" | "deepseek";

export type ChatRoute = {
  provider: ChatProviderId;
  /**
   * 智谱（zhipu）必填具体 model；
   * DeepSeek 使用服务端默认时可省略。
   */
  model?: string;
};

