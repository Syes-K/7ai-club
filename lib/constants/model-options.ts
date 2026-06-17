import type { LlmProviderId } from "@/lib/llm/provider";

export type ModelOption = {
  id: string;
  label: string;
};

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
