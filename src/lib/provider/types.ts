/** 上游厂商标识，不做枚举约束，由配置与 model 解析共同决定行为 */
export type ChatProviderId = string;

export type ChatRoute = {
  provider: ChatProviderId;
  /**
   * 具体 model id（按厂商规则：如 zhipu 通常必填；deepseek 可走默认时可省略）。
   */
  model?: string;
};

