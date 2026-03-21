import { FALLBACK_DEFAULTS } from "@/lib/config/defaults";

/**
 * @deprecated 服务端请用 `getAppConfig().maxMessagesInContext`
 */
export const MAX_MESSAGES_IN_CONTEXT =
  FALLBACK_DEFAULTS.maxMessagesInContext;

/** DeepSeek 请求使用的固定 model id（不提供配置项） */
export const DEEPSEEK_DEFAULT_MODEL = "deepseek-chat";
