import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import {
  formatModelConfigLabel,
  PLATFORM_DEFAULT_MODEL_NAME,
  PLATFORM_DEFAULT_PROVIDER,
} from "@/lib/constants/model-providers";
import { createTimeoutFetch, getLlmTimeoutMs } from "./timeout";

export type UserLlmProviderId =
  | "bailian"
  | "deepseek"
  | "siliconflow"
  | "openai";

/** @deprecated Env-only provider; user configs use UserLlmProviderId */
export type LlmProviderId = UserLlmProviderId | "nvidia";

export type ResolvedUserModel = {
  configId: string | null;
  provider: UserLlmProviderId;
  modelName: string;
  apiKey: string;
  label: string;
};

type ProviderRuntimeConfig = {
  baseURL: string;
  defaultModel: string;
  apiKeyEnv: string;
  baseUrlEnv: string;
  useOpenAICompatible?: boolean;
};

const PROVIDER_CONFIG: Record<LlmProviderId, ProviderRuntimeConfig> = {
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
    useOpenAICompatible: true,
  },
  bailian: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    defaultModel: PLATFORM_DEFAULT_MODEL_NAME,
    apiKeyEnv: "BAILIAN_API_KEY",
    baseUrlEnv: "BAILIAN_BASE_URL",
  },
  deepseek: {
    baseURL: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    baseUrlEnv: "DEEPSEEK_BASE_URL",
  },
  openai: {
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrlEnv: "OPENAI_BASE_URL",
  },
};

const PROVIDER_ALIASES: Record<string, LlmProviderId> = {
  siliconflow: "siliconflow",
  nvidia: "nvidia",
  bailian: "bailian",
  dashscope: "bailian",
  aliyun: "bailian",
  deepseek: "deepseek",
  openai: "openai",
};

const USER_PROVIDER_IDS = new Set<string>([
  "bailian",
  "deepseek",
  "siliconflow",
  "openai",
]);

export function isUserLlmProviderId(value: string): value is UserLlmProviderId {
  return USER_PROVIDER_IDS.has(value);
}

export function getProviderRuntimeConfig(
  provider: UserLlmProviderId,
): ProviderRuntimeConfig {
  return PROVIDER_CONFIG[provider];
}

export function getProviderBaseUrl(provider: UserLlmProviderId): string {
  const config = PROVIDER_CONFIG[provider];
  return process.env[config.baseUrlEnv]?.trim() || config.baseURL;
}

/** @deprecated Legacy env provider */
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

function createProviderClient(provider: UserLlmProviderId, apiKey: string) {
  const baseURL = getProviderBaseUrl(provider);
  const timeoutMs = getLlmTimeoutMs();
  const fetchImpl = createTimeoutFetch(timeoutMs);

  return createOpenAI({
    baseURL,
    apiKey,
    fetch: fetchImpl,
  });
}

/** OpenAI-compatible chat model from a resolved user configuration. */
export function getChatModelForResolvedConfig(
  resolved: ResolvedUserModel,
): LanguageModel {
  return createProviderClient(resolved.provider, resolved.apiKey).chat(
    resolved.modelName,
  );
}

export function getPlatformDefaultApiKey(): string | null {
  const key = process.env.BAILIAN_API_KEY?.trim();
  return key || null;
}

export function buildPlatformDefaultResolved(): ResolvedUserModel | null {
  const apiKey = getPlatformDefaultApiKey();
  if (!apiKey) {
    return null;
  }

  return {
    configId: null,
    provider: PLATFORM_DEFAULT_PROVIDER,
    modelName: PLATFORM_DEFAULT_MODEL_NAME,
    apiKey,
    label: formatModelConfigLabel(
      PLATFORM_DEFAULT_PROVIDER,
      PLATFORM_DEFAULT_MODEL_NAME,
    ),
  };
}

/** Returns a user-facing message when chat cannot run (Supabase / platform key). */
export function getChatLlmConfigError(): string | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    return "NEXT_PUBLIC_SUPABASE_URL is not set.";
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.";
  }

  if (!process.env.LLM_ENCRYPTION_KEY?.trim()) {
    return "LLM_ENCRYPTION_KEY is not set. Add it in your environment variables.";
  }

  return null;
}

/** @deprecated Use getChatLlmConfigError + resolveUserModelForChat */
export function getLlmConfigError(): string | null {
  return getChatLlmConfigError();
}

/** @deprecated iter-05 — use getChatModelForResolvedConfig */
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

/** @deprecated iter-05 — use getChatModelForResolvedConfig */
export function getChatModel(
  assistantModel?: string,
  preferredModel?: string | null,
): LanguageModel {
  const provider = getLlmProviderId();
  const modelId = resolveChatModelId(assistantModel, preferredModel);

  if (provider === "nvidia") {
    return createNvidiaClient().chatModel(modelId);
  }

  if (isUserLlmProviderId(provider)) {
    const apiKey = process.env[PROVIDER_CONFIG[provider].apiKeyEnv] ?? "";
    return getChatModelForResolvedConfig({
      configId: null,
      provider,
      modelName: modelId,
      apiKey,
      label: `${modelId} (${provider})`,
    });
  }

  return getChatModelForResolvedConfig({
    configId: null,
    provider: "siliconflow",
    modelName: modelId,
    apiKey: process.env.SILICONFLOW_API_KEY ?? "",
    label: `${modelId} (siliconflow)`,
  });
}

/** @deprecated iter-05 — label from resolved config */
export function getLlmDisplayLabel(
  assistantModel?: string,
  preferredModel?: string | null,
): string {
  const provider = getLlmProviderId();
  const model = resolveChatModelId(assistantModel, preferredModel);
  return `${model} (${provider})`;
}
