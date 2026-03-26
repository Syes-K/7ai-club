import { DEEPSEEK_DEFAULT_MODEL } from "@/lib/provider/constants";
import type { ChatMessage } from "@/lib/chat/types";
import type { ChatProviderId } from "./types";
import { MODEL_GROUPS, type ModelOption } from "./models";
import { logChat } from "@/lib/chat/logger";

function toOpenAIMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

type ProviderLogContext = {
  requestId: string;
  messageCount: number;
  provider: string;
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
export async function fetchChatUpstreamSseStream(params: {
  provider: ChatProviderId;
  model: string | undefined;
  messages: ChatMessage[];
  requestId: string;
  options?: { skipChatLog?: boolean };
}): Promise<ReadableStream<Uint8Array>> {
  return fetchChatUpstreamSseStreamByProvider(params);
}

type OpenAIChatNonStream = {
  choices?: { message?: { content?: string | null } }[];
};

type ProviderRequestCommon = {
  provider: ChatProviderId;
  model: string | undefined;
  messages: ChatMessage[];
  requestId: string;
  options?: { skipChatLog?: boolean };
};

function resolveModelId(provider: ChatProviderId, inputModel: string | undefined) {
  const m = typeof inputModel === "string" ? inputModel.trim() : "";
  if (m) return m;
  if (provider === "deepseek") return DEEPSEEK_DEFAULT_MODEL;
  throw new Error("model 缺失：需要 zhipu 指定 model，或 deepseek 走默认 model");
}

function parseNonStreamContent(text: string): string {
  let json: OpenAIChatNonStream;
  try {
    json = JSON.parse(text) as OpenAIChatNonStream;
  } catch {
    throw new Error("响应非 JSON");
  }
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("响应无有效正文");
  return content;
}

const MODEL_OPTIONS: ModelOption[] = MODEL_GROUPS.flatMap((g) => g.models);

/** 根据 model id 获取上游请求的 meta */
function resolveUpstreamMeta(model: string) {
  const opt = MODEL_OPTIONS.find((m) => m.id === model);
  if (!opt) {
    throw new Error(`model 不存在：${model}`);
  }
  if (!opt.apiKey) {
    throw new Error(`服务端未配置 API Key（model: ${model}）`);
  }
  return {
    apiKey: opt.apiKey,
    url: `${opt.baseUrl}/completions`,
  };
}

/** 流式对话，用于对话等核心调用 */
async function fetchChatUpstreamSseStreamByProvider(
  params: ProviderRequestCommon
): Promise<ReadableStream<Uint8Array>> {
  const { provider, model, messages, requestId, options } = params;
  const skipLog = options?.skipChatLog === true;

  const resolvedModel = resolveModelId(provider, model);
  const meta = resolveUpstreamMeta(resolvedModel);
  const key = meta.apiKey;
  const url = meta.url;

  const ctx: ProviderLogContext = {
    requestId,
    messageCount: messages.length,
    provider,
    model: resolvedModel,
    messages: messages.map((mm) => ({ role: mm.role, content: mm.content })),
  };

  if (!skipLog) logProviderStart(ctx);
  const startedAt = Date.now();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(
      {
        model: resolvedModel,
        messages: toOpenAIMessages(messages),
        stream: true,
      }
    ),
  });

  if (!res.ok) {
    const text = await res.text();
    if (!skipLog) logProviderError(ctx, res.status, text || res.statusText);
    throw new Error(`Chat API 错误 ${res.status}: ${text.slice(0, 500) || res.statusText}`);
  }

  if (!res.body) throw new Error("响应无 body");
  if (!skipLog) logProviderSuccess(ctx, res.status, Date.now() - startedAt);
  return res.body;
}

/** 非流式补全，用于摘要等辅助调用 */
export async function fetchChatCompletionText(params: {
  provider: ChatProviderId;
  model: string | undefined;
  messages: ChatMessage[];
  requestId: string;
  maxTokens?: number;
}): Promise<string> {
  const { provider, model, messages, requestId, maxTokens } = params;

  const resolvedModel = resolveModelId(provider, model);
  const meta = resolveUpstreamMeta(resolvedModel);
  const key = meta.apiKey;
  const url = meta.url;
  const ctx: ProviderLogContext = {
    requestId,
    messageCount: messages.length,
    provider,
    model: resolvedModel,
    messages: messages.map((x) => ({ role: x.role, content: x.content })),
  };

  logProviderStart(ctx);
  const startedAt = Date.now();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(
      {
        model: resolvedModel,
        messages: toOpenAIMessages(messages),
        stream: false,
        max_tokens: maxTokens ?? 2048,
      }
    ),
  });

  const text = await res.text();
  if (!res.ok) {
    logProviderError(ctx, res.status, text || res.statusText);
    throw new Error(`Chat API 错误 ${res.status}: ${text.slice(0, 500) || res.statusText}`);
  }

  const content = parseNonStreamContent(text);
  logProviderSuccess(ctx, res.status, Date.now() - startedAt);
  return content;
}

