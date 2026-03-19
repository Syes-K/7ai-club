import { ZHIPU_MODEL_IDS } from "./zhipu-models";
import type { ChatMessage, ChatProviderId } from "./types";
import { DEFAULT_CHAT_ROUTE } from "./route-key";
import { MAX_MESSAGES_IN_CONTEXT } from "./constants";

export type ChatApiBody = {
  messages: ChatMessage[];
  provider: ChatProviderId;
  model?: string;
};

function isChatRole(r: string): r is ChatMessage["role"] {
  return r === "user" || r === "assistant" || r === "system";
}

export function parseAndValidateChatBody(
  raw: unknown
): { ok: true; data: ChatApiBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "请求体须为 JSON 对象" };
  }
  const o = raw as Record<string, unknown>;
  const provider = o.provider;
  if (provider !== "zhipu" && provider !== "deepseek") {
    return { ok: false, error: "provider 须为 zhipu 或 deepseek" };
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

  const sliced = messages.slice(-MAX_MESSAGES_IN_CONTEXT);

  if (provider === "zhipu") {
    const model =
      typeof o.model === "string" && o.model.length > 0
        ? o.model
        : DEFAULT_CHAT_ROUTE.model!;
    if (!ZHIPU_MODEL_IDS.includes(model)) {
      return { ok: false, error: `不支持的智谱模型: ${model}` };
    }
    return { ok: true, data: { messages: sliced, provider: "zhipu", model } };
  }

  return { ok: true, data: { messages: sliced, provider: "deepseek" } };
}
