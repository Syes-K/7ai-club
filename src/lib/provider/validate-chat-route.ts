import { MODEL_IDS } from "./models";
import type { ChatProviderId } from "./types";

export type ChatRouteProviderValidationError = {
  field: string;
  code: "CFG_ROUTE_BROKEN";
  message: string;
};

export function validateChatRouteProviderAndModel(input: {
  provider?: unknown;
  model?: unknown;
}): {
  provider: ChatProviderId | null;
  model?: string;
  fieldErrors: ChatRouteProviderValidationError[];
} {
  const fieldErrors: ChatRouteProviderValidationError[] = [];
  const providerRaw = input.provider;

  if (typeof providerRaw !== "string" || !providerRaw.trim()) {
    fieldErrors.push({
      field: "chatRoute.provider",
      code: "CFG_ROUTE_BROKEN",
      message: "chatRoute.provider 须为非空字符串",
    });
  }

  const provider =
    typeof providerRaw === "string" && providerRaw.trim()
      ? (providerRaw.trim() as ChatProviderId)
      : null;
  const modelRaw = input.model;
  const model =
    typeof modelRaw === "string" && modelRaw.trim() ? modelRaw.trim() : undefined;

  if (model && !MODEL_IDS.includes(model)) {
    fieldErrors.push({
      field: "chatRoute.model",
      code: "CFG_ROUTE_BROKEN",
      message: `chatRoute.model 不是已支持的模型: ${model}`,
    });
  }

  return { provider, model, fieldErrors };
}

