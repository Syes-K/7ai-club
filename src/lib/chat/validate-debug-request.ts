import { getAppConfig } from "@/lib/config";
import type { ChatMessage } from "@/lib/chat/types";
import type { ChatProviderId } from "@/lib/provider/types";
import { DEEPSEEK_DEFAULT_MODEL } from "@/lib/provider/constants";

export type DebugChatBody = {
  messages: ChatMessage[];
  provider: ChatProviderId;
  /** zhipu 时必有（校验后） */
  model?: string;
};

function isChatRole(r: string): r is ChatMessage["role"] {
  return r === "user" || r === "assistant" || r === "system";
}

export function parseAndValidateDebugChatBody(
  raw: unknown
): { ok: true; data: DebugChatBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "请求体须为 JSON 对象" };
  }
  const o = raw as Record<string, unknown>;
  const providerRaw = o.provider;
  const modelRaw =
    typeof o.model === "string" && o.model.trim() ? o.model.trim() : undefined;

  let provider: ChatProviderId | undefined;
  if (typeof providerRaw === "string" && providerRaw.trim()) {
    provider = providerRaw.trim();
  } else if (modelRaw) {
    // 不传 provider 时：根据 model id 推导提供商
    provider = modelRaw === DEEPSEEK_DEFAULT_MODEL ? "deepseek" : "zhipu";
  } else {
    return { ok: false, error: "provider 或 model 须提供" };
  }

  const messagesRaw = o.messages;
  if (!Array.isArray(messagesRaw) || messagesRaw.length === 0) {
    return { ok: false, error: "messages 须为非空数组" };
  }

  const messages: ChatMessage[] = [];
  for (const item of messagesRaw) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "messages 项格式无效" };
    }
    const m = item as Record<string, unknown>;
    const role = m.role;
    const content = m.content;
    if (typeof role !== "string" || !isChatRole(role)) {
      return { ok: false, error: "消息 role 无效" };
    }
    if (typeof content !== "string") {
      return { ok: false, error: "消息 content 须为字符串" };
    }
    messages.push({ role, content });
  }

  const K = getAppConfig().maxMessagesInContext;
  const sliced = messages.slice(-K);

  if (provider === "zhipu") {
    const cfg = getAppConfig();
    const model =
      modelRaw ?? cfg.defaultModel;
    return {
      ok: true,
      data: { messages: sliced, provider, model },
    };
  }

  if (provider === "deepseek") {
    return { ok: true, data: { messages: sliced, provider } };
  }

  if (!modelRaw) {
    return {
      ok: false,
      error: "非 zhipu/deepseek 的 provider 须提供非空 model",
    };
  }
  return {
    ok: true,
    data: { messages: sliced, provider, model: modelRaw },
  };
}

