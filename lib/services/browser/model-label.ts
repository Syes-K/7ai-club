import {
  getDefaultModelForProvider,
  getPublicLlmProviderId,
  resolveBrowserChatModelId,
} from "@/lib/constants/model-options";

export function getDisplayModelLabel(
  assistantModel?: string,
  preferredModel?: string | null,
): string {
  const provider = getPublicLlmProviderId();
  const model = resolveBrowserChatModelId(assistantModel, preferredModel);
  return `${model} (${provider})`;
}

export function getDefaultDisplayModelLabel(): string {
  const provider = getPublicLlmProviderId();
  return `${getDefaultModelForProvider(provider)} (${provider})`;
}
