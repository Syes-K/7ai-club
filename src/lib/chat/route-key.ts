import { FALLBACK_DEFAULTS } from "@/lib/config/defaults";
import type { ChatRoute } from "@/lib/provider/types";

/**
 * 客户端构建期默认路由；运行时服务端以 `getAppConfig()` 为准。
 * 对话页宜再请求 `/api/config/public` 与配置对齐（见 0.0.4 前端说明）。
 */
export const DEFAULT_CHAT_ROUTE: ChatRoute = {
  provider: FALLBACK_DEFAULTS.defaultProvider,
  model: FALLBACK_DEFAULTS.defaultModel,
};
