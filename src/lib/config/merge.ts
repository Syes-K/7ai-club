import { ZHIPU_MODEL_IDS } from "@/lib/chat/zhipu-models";
import type { AppConfig } from "./defaults";
import { FALLBACK_DEFAULTS } from "./defaults";

/** 将磁盘上的部分 JSON 与默认值合并（容错，不抛） */
export function mergeAppConfigPartial(partial: unknown): AppConfig {
  const d = FALLBACK_DEFAULTS;
  if (!partial || typeof partial !== "object") {
    return { ...d };
  }
  const o = partial as Record<string, unknown>;

  let max = d.maxMessagesInContext;
  if (
    typeof o.maxMessagesInContext === "number" &&
    Number.isInteger(o.maxMessagesInContext) &&
    o.maxMessagesInContext >= 1 &&
    o.maxMessagesInContext <= 200
  ) {
    max = o.maxMessagesInContext;
  }

  let defaultProvider = d.defaultProvider;
  if (o.defaultProvider === "zhipu" || o.defaultProvider === "deepseek") {
    defaultProvider = o.defaultProvider;
  }

  let defaultModel = d.defaultModel;
  if (
    typeof o.defaultModel === "string" &&
    ZHIPU_MODEL_IDS.includes(o.defaultModel.trim())
  ) {
    defaultModel = o.defaultModel.trim();
  }

  const chatLoggingEnabled =
    typeof o.chatLoggingEnabled === "boolean"
      ? o.chatLoggingEnabled
      : d.chatLoggingEnabled;

  let appDisplayName = d.appDisplayName;
  if (typeof o.appDisplayName === "string" && o.appDisplayName.trim()) {
    appDisplayName = o.appDisplayName.trim().slice(0, 40);
  }

  return {
    maxMessagesInContext: max,
    defaultProvider,
    defaultModel,
    chatLoggingEnabled,
    appDisplayName,
  };
}
