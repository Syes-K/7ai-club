import { getAppConfig } from "@/lib/config";
import type { ChatMessage } from "@/lib/chat/types";
import type { ChatProviderId } from "@/lib/provider/types";

export type ChatApiBody =
  | {
      variant: "legacy";
      messages: ChatMessage[];
      provider: ChatProviderId;
      model?: string;
    }
  | {
      variant: "session";
      sessionId: string;
      provider: ChatProviderId;
      model?: string;
      retryLast: boolean;
      /** retryLast 为 false 时必有；为 true 时为 undefined */
      content: string | undefined;
    };

function isChatRole(r: string): r is ChatMessage["role"] {
  return r === "user" || r === "assistant" || r === "system";
}

function resolveZhipuModel(raw: Record<string, unknown>): string {
  const cfg = getAppConfig();
  return typeof raw.model === "string" && raw.model.trim()
    ? raw.model.trim()
    : cfg.defaultModel;
}

function explicitModelFromBody(raw: Record<string, unknown>): string | undefined {
  return typeof raw.model === "string" && raw.model.trim()
    ? raw.model.trim()
    : undefined;
}

export function parseAndValidateChatBody(
  raw: unknown
): { ok: true; data: ChatApiBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "请求体须为 JSON 对象" };
  }
  const o = raw as Record<string, unknown>;
  const provider = o.provider;
  if (typeof provider !== "string" || !provider.trim()) {
    return { ok: false, error: "provider 须为非空字符串" };
  }
  const pv = provider.trim();

  const sessionIdRaw = o.sessionId;
  const hasSessionId =
    typeof sessionIdRaw === "string" && sessionIdRaw.trim().length > 0;

  if (hasSessionId) {
    if (o.messages !== undefined) {
      return { ok: false, error: "不可同时使用 sessionId 与 messages" };
    }
    const sessionId = (sessionIdRaw as string).trim();
    const retryLast = o.retryLast === true;
    const contentRaw = typeof o.content === "string" ? o.content.trim() : "";

    if (retryLast) {
      if (contentRaw.length > 0) {
        return { ok: false, error: "retryLast 为 true 时不应提供 content" };
      }
    } else if (!contentRaw) {
      return {
        ok: false,
        error: "须提供非空 content，或设置 retryLast: true",
      };
    }

    if (pv === "zhipu") {
      const model = resolveZhipuModel(o);
      return {
        ok: true,
        data: {
          variant: "session",
          sessionId,
          provider: pv,
          model,
          retryLast,
          content: retryLast ? undefined : contentRaw,
        },
      };
    }

    if (pv === "deepseek") {
      return {
        ok: true,
        data: {
          variant: "session",
          sessionId,
          provider: pv,
          retryLast,
          content: retryLast ? undefined : contentRaw,
        },
      };
    }

    const modelOther = explicitModelFromBody(o);
    if (!modelOther) {
      return {
        ok: false,
        error: "非 zhipu/deepseek 的 provider 须在请求体提供非空 model",
      };
    }
    return {
      ok: true,
      data: {
        variant: "session",
        sessionId,
        provider: pv,
        model: modelOther,
        retryLast,
        content: retryLast ? undefined : contentRaw,
      },
    };
  }

  const messagesRaw = o.messages;
  if (!Array.isArray(messagesRaw) || messagesRaw.length === 0) {
    return { ok: false, error: "messages 须为非空数组，或提供 sessionId" };
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

  const sliced = messages.slice(-getAppConfig().maxMessagesInContext);

  if (pv === "zhipu") {
    const model = resolveZhipuModel(o);
    return {
      ok: true,
      data: {
        variant: "legacy",
        messages: sliced,
        provider: pv,
        model,
      },
    };
  }

  if (pv === "deepseek") {
    return {
      ok: true,
      data: { variant: "legacy", messages: sliced, provider: pv },
    };
  }

  const modelLegacy = explicitModelFromBody(o);
  if (!modelLegacy) {
    return {
      ok: false,
      error: "非 zhipu/deepseek 的 provider 须在请求体提供非空 model",
    };
  }
  return {
    ok: true,
    data: {
      variant: "legacy",
      messages: sliced,
      provider: pv,
      model: modelLegacy,
    },
  };
}

