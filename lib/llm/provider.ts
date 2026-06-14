import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

export type LlmProviderId = "siliconflow" | "nvidia";

const PROVIDER_CONFIG: Record<
  LlmProviderId,
  { baseURL: string; defaultModel: string; apiKeyEnv: string; baseUrlEnv: string }
> = {
  siliconflow: {
    baseURL: "https://api.siliconflow.cn/v1",
    defaultModel: "Qwen/Qwen2.5-7B-Instruct",
    apiKeyEnv: "SILICONFLOW_API_KEY",
    baseUrlEnv: "SILICONFLOW_BASE_URL",
  },
  nvidia: {
    baseURL: "https://integrate.api.nvidia.com/v1",
    // deepseek-r1 is deprecated on build.nvidia.com; use v4 flash/pro instead
    defaultModel: "deepseek-ai/deepseek-v4-flash",
    apiKeyEnv: "NVIDIA_API_KEY",
    baseUrlEnv: "NVIDIA_BASE_URL",
  },
};

export function getLlmProviderId(): LlmProviderId {
  const raw = process.env.LLM_PROVIDER?.trim().toLowerCase();
  return raw === "nvidia" ? "nvidia" : "siliconflow";
}

export function getDefaultModel(provider: LlmProviderId = getLlmProviderId()): string {
  return PROVIDER_CONFIG[provider].defaultModel;
}

/** Resolved model id: LLM_MODEL env > active provider default. */
export function resolveChatModelId(_assistantModel?: string): string {
  if (process.env.LLM_MODEL?.trim()) {
    return process.env.LLM_MODEL.trim();
  }
  return getDefaultModel();
}

function createSiliconFlowClient() {
  const config = PROVIDER_CONFIG.siliconflow;
  const baseURL = process.env[config.baseUrlEnv]?.trim() || config.baseURL;
  const apiKey = process.env[config.apiKeyEnv];

  return createOpenAI({ baseURL, apiKey });
}

function createNvidiaClient() {
  const config = PROVIDER_CONFIG.nvidia;
  const baseURL = process.env[config.baseUrlEnv]?.trim() || config.baseURL;
  const apiKey = process.env[config.apiKeyEnv];

  return createOpenAICompatible({
    name: "nvidia-nim",
    baseURL,
    apiKey,
  });
}

/** OpenAI-compatible Chat Completions (not Responses API). */
export function getChatModel(assistantModel?: string): LanguageModel {
  const provider = getLlmProviderId();
  const modelId = resolveChatModelId(assistantModel);

  if (provider === "nvidia") {
    return createNvidiaClient().chatModel(modelId);
  }

  return createSiliconFlowClient().chat(modelId);
}

export function getLlmDisplayLabel(assistantModel?: string): string {
  const provider = getLlmProviderId();
  const model = resolveChatModelId(assistantModel);
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
