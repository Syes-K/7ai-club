import type { ChatProviderId, ChatRoute } from "./types";

export function normalizeChatRouteModel(
  provider: ChatProviderId,
  model: string | undefined
): string | undefined {
  if (provider !== "zhipu") return undefined;
  const m = typeof model === "string" ? model.trim() : "";
  return m ? m : undefined;
}

export function buildChatRouteConfig(provider: ChatProviderId, model?: string): ChatRoute {
  const normalizedModel = normalizeChatRouteModel(provider, model);
  return {
    provider,
    ...(normalizedModel ? { model: normalizedModel } : {}),
  };
}

