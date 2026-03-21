import { DEEPSEEK_DEFAULT_MODEL } from "./constants";
import type { ChatMessage } from "./types";
import { logChat } from "./logger";

const ZHIPU_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

function toOpenAIMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

type ProviderLogContext = {
  requestId: string;
  messageCount: number;
  provider: "zhipu" | "deepseek";
  model: string;
  messages: { role: ChatMessage["role"]; content: string }[];
};

function logProviderStart(ctx: ProviderLogContext) {
  void logChat("info", "provider.request_start", ctx);
}

function logProviderError(ctx: ProviderLogContext, status: number, detail: string) {
  void logChat("error", "provider.request_error", {
    ...ctx,
    status,
    detail: detail.slice(0, 500),
  });
}

function logProviderSuccess(ctx: ProviderLogContext, status: number, elapsedMs: number) {
  void logChat("info", "provider.request_ok", {
    ...ctx,
    status,
    elapsedMs,
  });
}

/** 返回厂商原始 SSE 字节流（OpenAI 兼容格式） */
export async function fetchZhipuSseStream(
  messages: ChatMessage[],
  model: string,
  requestId = "unknown"
): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.ZHIPU_API_KEY;
  if (!key) {
    throw new Error("服务端未配置 ZHIPU_API_KEY");
  }

  const ctx: ProviderLogContext = {
    requestId,
    messageCount: messages.length,
    provider: "zhipu",
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };
  logProviderStart(ctx);
  const startedAt = Date.now();

  const res = await fetch(ZHIPU_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: toOpenAIMessages(messages),
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logProviderError(ctx, res.status, text || res.statusText);
    throw new Error(
      `智谱 API 错误 ${res.status}: ${text.slice(0, 500) || res.statusText}`
    );
  }

  if (!res.body) throw new Error("智谱响应无 body");
  logProviderSuccess(ctx, res.status, Date.now() - startedAt);
  return res.body;
}

export async function fetchDeepseekSseStream(
  messages: ChatMessage[],
  requestId = "unknown"
): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error("服务端未配置 DEEPSEEK_API_KEY");
  }

  const deepseekModel = DEEPSEEK_DEFAULT_MODEL;
  const ctx: ProviderLogContext = {
    requestId,
    messageCount: messages.length,
    provider: "deepseek",
    model: deepseekModel,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };
  logProviderStart(ctx);
  const startedAt = Date.now();

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: deepseekModel,
      messages: toOpenAIMessages(messages),
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logProviderError(ctx, res.status, text || res.statusText);
    throw new Error(
      `DeepSeek API 错误 ${res.status}: ${text.slice(0, 500) || res.statusText}`
    );
  }

  if (!res.body) throw new Error("DeepSeek 响应无 body");
  logProviderSuccess(ctx, res.status, Date.now() - startedAt);
  return res.body;
}
