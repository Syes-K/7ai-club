import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { createTimeoutFetch, getLlmTimeoutMs } from "./timeout";

export type LlmProviderId = "siliconflow" | "nvidia" | "bailian";

const PROVIDER_CONFIG: Record<
  LlmProviderId,
  { baseURL: string; defaultModel: string; apiKeyEnv: string; baseUrlEnv: string }
> = {
  siliconflow: {
    baseURL: "https://api.siliconflow.cn/v1",
    defaultModel: "deepseek-ai/DeepSeek-OCR",
    apiKeyEnv: "SILICONFLOW_API_KEY",
    baseUrlEnv: "SILICONFLOW_BASE_URL",
  },
  nvidia: {
    baseURL: "https://integrate.api.nvidia.com/v1",
    defaultModel: "deepseek-ai/deepseek-v4-flash",
    apiKeyEnv: "NVIDIA_API_KEY",
    baseUrlEnv: "NVIDIA_BASE_URL",
  },
  bailian: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: "qwen3.6-plus",
    apiKeyEnv: "BAILIAN_API_KEY",
    baseUrlEnv: "BAILIAN_BASE_URL",
  },
};

const PROVIDER_ALIASES: Record<string, LlmProviderId> = {
  siliconflow: "siliconflow",
  nvidia: "nvidia",
  bailian: "bailian",
  dashscope: "bailian",
  aliyun: "bailian",
};

export function getLlmProviderId(): LlmProviderId {
  const raw = process.env.LLM_PROVIDER?.trim().toLowerCase() ?? "";
  return PROVIDER_ALIASES[raw] ?? "siliconflow";
}

export function getActiveApiKeyEnv(
  provider: LlmProviderId = getLlmProviderId(),
): string {
  return PROVIDER_CONFIG[provider].apiKeyEnv;
}

export function getDefaultModel(provider: LlmProviderId = getLlmProviderId()): string {
  return PROVIDER_CONFIG[provider].defaultModel;
}

/** Resolved model id: profile preference > LLM_MODEL env > active provider default. */
export function resolveChatModelId(
  _assistantModel?: string,
  preferredModel?: string | null,
): string {
  if (preferredModel?.trim()) {
    return preferredModel.trim();
  }
  if (process.env.LLM_MODEL?.trim()) {
    return process.env.LLM_MODEL.trim();
  }
  return getDefaultModel();
}

function createChatCompletionsClient(
  provider: Extract<LlmProviderId, "siliconflow" | "bailian">,
) {
  const config = PROVIDER_CONFIG[provider];
  const baseURL = process.env[config.baseUrlEnv]?.trim() || config.baseURL;
  const apiKey = process.env[config.apiKeyEnv];
  const timeoutMs = getLlmTimeoutMs();

  return createOpenAI({
    baseURL,
    apiKey,
    fetch: createTimeoutFetch(timeoutMs),
  });
}

function createNvidiaClient() {
  const config = PROVIDER_CONFIG.nvidia;
  const baseURL = process.env[config.baseUrlEnv]?.trim() || config.baseURL;
  const apiKey = process.env[config.apiKeyEnv];
  const timeoutMs = getLlmTimeoutMs();

  return createOpenAICompatible({
    name: "nvidia-nim",
    baseURL,
    apiKey,
    fetch: createTimeoutFetch(timeoutMs),
  });
}

/** OpenAI-compatible Chat Completions (not Responses API). */
export function getChatModel(
  assistantModel?: string,
  preferredModel?: string | null,
): LanguageModel {
  const provider = getLlmProviderId();
  const modelId = resolveChatModelId(assistantModel, preferredModel);

  if (provider === "nvidia") {
    return createNvidiaClient().chatModel(modelId);
  }

  if (provider === "bailian") {
    return createChatCompletionsClient("bailian").chat(modelId);
  }

  return createChatCompletionsClient("siliconflow").chat(modelId);
}

export function getLlmDisplayLabel(
  assistantModel?: string,
  preferredModel?: string | null,
): string {
  const provider = getLlmProviderId();
  const model = resolveChatModelId(assistantModel, preferredModel);
  return `${model} (${provider})`;
}

/** Returns a user-facing message when the active provider is misconfigured. */
export function getLlmConfigError(): string | null {
  const provider = getLlmProviderId();
  const config = PROVIDER_CONFIG[provider];
  const apiKey = process.env[config.apiKeyEnv]?.trim();

  if (!apiKey) {
    return `${config.apiKeyEnv} is not set. Add it in Vercel → Project Settings → Environment Variables, then redeploy.`;
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return "NEXT_PUBLIC_SUPABASE_URL is not set.";
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.";
  }

  return null;
}
