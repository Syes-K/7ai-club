import type { LlmProviderId } from "@/lib/llm/provider";

export type ModelOption = {
  id: string;
  label: string;
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

const PROVIDER_DEFAULT_MODELS: Record<LlmProviderId, string> = {
  siliconflow: "deepseek-ai/DeepSeek-OCR",
  nvidia: "deepseek-ai/deepseek-v4-flash",
  bailian: "qwen3.6-plus",
  deepseek: "deepseek-chat",
  openai: "gpt-4o-mini",
};

export function getPublicLlmProviderId(): LlmProviderId {
  const raw = process.env.NEXT_PUBLIC_LLM_PROVIDER?.trim().toLowerCase() ?? "";
  return PROVIDER_ALIASES[raw] ?? "siliconflow";
}

export function getDefaultModelForProvider(
  provider: LlmProviderId = getPublicLlmProviderId(),
): string {
  return PROVIDER_DEFAULT_MODELS[provider];
}

/** Browser: profile preference > public default model env > provider default. */
export function resolveBrowserChatModelId(
  _assistantModel?: string,
  preferredModel?: string | null,
): string {
  if (preferredModel?.trim()) {
    return preferredModel.trim();
  }
  if (process.env.NEXT_PUBLIC_LLM_MODEL?.trim()) {
    return process.env.NEXT_PUBLIC_LLM_MODEL.trim();
  }
  return getDefaultModelForProvider();
}

const MODEL_OPTIONS: Record<LlmProviderId, ModelOption[]> = {
  siliconflow: [
    { id: "deepseek-ai/DeepSeek-V3", label: "DeepSeek V3" },
    { id: "Qwen/Qwen2.5-7B-Instruct", label: "Qwen 2.5 7B Instruct" },
    { id: "deepseek-ai/DeepSeek-OCR", label: "DeepSeek OCR" },
  ],
  nvidia: [
    { id: "deepseek-ai/deepseek-v4-flash", label: "DeepSeek V4 Flash" },
    { id: "meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B Instruct" },
  ],
  bailian: [
    { id: "qwen3.6-plus", label: "Qwen 3.6 Plus" },
    { id: "qwen-plus", label: "Qwen Plus" },
    { id: "qwen-turbo", label: "Qwen Turbo" },
  ],
  deepseek: [{ id: "deepseek-chat", label: "DeepSeek Chat" }],
  openai: [{ id: "gpt-4o-mini", label: "GPT-4o mini" }],
};

export function getModelOptionsForProvider(provider: LlmProviderId): ModelOption[] {
  return MODEL_OPTIONS[provider];
}

export function isValidModelForProvider(
  provider: LlmProviderId,
  modelId: string,
): boolean {
  return MODEL_OPTIONS[provider].some((option) => option.id === modelId);
}
