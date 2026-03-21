import { ZHIPU_MODEL_IDS } from "@/lib/chat/zhipu-models";
import type { ChatProviderId } from "@/lib/chat/types";
import type { AppConfig } from "./defaults";

export function validateAppConfigForSave(
  body: unknown
): { ok: true; config: AppConfig } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "请求体须为 JSON 对象" };
  }
  const o = body as Record<string, unknown>;

  const max = o.maxMessagesInContext;
  if (
    typeof max !== "number" ||
    !Number.isInteger(max) ||
    max < 1 ||
    max > 200
  ) {
    return {
      ok: false,
      error: "maxMessagesInContext 须为 1～200 的整数",
    };
  }

  const p = o.defaultProvider;
  if (p !== "zhipu" && p !== "deepseek") {
    return { ok: false, error: "defaultProvider 须为 zhipu 或 deepseek" };
  }
  const defaultProvider = p as ChatProviderId;

  const dm = o.defaultModel;
  if (typeof dm !== "string" || !dm.trim()) {
    return { ok: false, error: "defaultModel 须为非空字符串" };
  }
  const defaultModel = dm.trim();
  if (!ZHIPU_MODEL_IDS.includes(defaultModel)) {
    return { ok: false, error: `defaultModel 不是已支持的智谱模型: ${defaultModel}` };
  }

  const log = o.chatLoggingEnabled;
  if (typeof log !== "boolean") {
    return { ok: false, error: "chatLoggingEnabled 须为布尔值" };
  }

  const name = o.appDisplayName;
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, error: "appDisplayName 须为非空字符串" };
  }
  const appDisplayName = name.trim().slice(0, 40);
  if (appDisplayName.length === 0) {
    return { ok: false, error: "appDisplayName 无效" };
  }

  return {
    ok: true,
    config: {
      maxMessagesInContext: max,
      defaultProvider,
      defaultModel,
      chatLoggingEnabled: log,
      appDisplayName,
    },
  };
}
