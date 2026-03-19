import type { ChatRoute } from "./types";

/** 与 PRD / 用户故事 US-1 AC1.4 一致：默认智谱 glm-4-flash */
export const DEFAULT_CHAT_ROUTE: ChatRoute = {
  provider: "zhipu",
  model: "glm-4-flash",
};
