import type { UserLlmProviderId } from "@/lib/llm/provider";

export const PLATFORM_DEFAULT_CONFIG_ID =
  "00000000-0000-0000-0000-000000000001" as const;

/** UI sentinel for Preferences summary model dropdown (persisted as null). */
export const SUMMARY_SAME_AS_CHAT_ID = "__same_as_chat__" as const;

export const PLATFORM_DEFAULT_PROVIDER = "bailian" as const;
export const PLATFORM_DEFAULT_MODEL_NAME = "qwen3.6-plus";

export const USER_LLM_PROVIDER_IDS: UserLlmProviderId[] = [
  "bailian",
  "deepseek",
  "siliconflow",
  "openai",
];

export const PROVIDER_LABELS: Record<UserLlmProviderId, string> = {
  bailian: "Bailian",
  deepseek: "DeepSeek",
  siliconflow: "SiliconFlow",
  openai: "OpenAI",
};

export function getProviderLabel(provider: UserLlmProviderId): string {
  return PROVIDER_LABELS[provider];
}

export function formatModelConfigLabel(
  provider: UserLlmProviderId,
  modelName: string,
): string {
  return `${getProviderLabel(provider)} — ${modelName}`;
}

export function formatModelLabel(
  provider: UserLlmProviderId,
  modelName: string,
): string {
  return `${modelName} (${provider})`;
}

export function isPlatformDefaultConfigId(id: string | null | undefined): boolean {
  return id === PLATFORM_DEFAULT_CONFIG_ID || id == null;
}

export function normalizePreferredConfigId(
  id: string | null | undefined,
): string | null {
  if (id == null || id === "" || id === PLATFORM_DEFAULT_CONFIG_ID) {
    return null;
  }
  return id;
}
