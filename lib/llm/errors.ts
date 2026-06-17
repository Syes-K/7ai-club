import { getActiveApiKeyEnv, getLlmProviderId } from "./provider";

export type LlmErrorKind =
  | "config"
  | "chunk_timeout"
  | "total_timeout"
  | "upstream_auth"
  | "upstream"
  | "client_abort"
  | "unknown";

function getKeyEnvLabel(): string {
  return getActiveApiKeyEnv();
}

export function classifyLlmError(error: unknown): LlmErrorKind {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  const lower = message.toLowerCase();
  const name = error instanceof Error ? error.name : "";

  if (name === "AbortError" || lower.includes("aborted")) {
    if (lower.includes("timeout") || lower.includes("timed out")) {
      if (lower.includes("chunk") || lower.includes("idle")) {
        return "chunk_timeout";
      }
      return "total_timeout";
    }
    return "client_abort";
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return "total_timeout";
  }

  if (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("invalid api key") ||
    lower.includes("incorrect api key") ||
    lower.includes("unauthorized")
  ) {
    return "upstream_auth";
  }

  if (lower.includes("is not set")) {
    return "config";
  }

  if (message) {
    return "upstream";
  }

  return "unknown";
}

export function toUserFacingLlmMessage(
  kind: LlmErrorKind,
  provider = getLlmProviderId(),
): string {
  const keyEnv = getActiveApiKeyEnv(provider);

  switch (kind) {
    case "chunk_timeout":
      return "The model took too long to start streaming. Try again, or set LLM_CHUNK_TIMEOUT_MS higher in your environment.";
    case "total_timeout":
      return "The request timed out. Try a faster model (LLM_MODEL), increase LLM_TIMEOUT_MS, or switch LLM_PROVIDER.";
    case "upstream_auth":
      if (provider === "bailian") {
        return `LLM API key rejected. Check ${keyEnv} and that BAILIAN_BASE_URL matches your key region (Beijing / Singapore / US), then redeploy.`;
      }
      return `LLM API key rejected. Check ${keyEnv} and LLM_PROVIDER, then redeploy.`;
    case "client_abort":
      return "The request was cancelled. If this happens often, the model may be too slow for the current timeout settings.";
    case "config":
      return `LLM is not configured. Set ${keyEnv} and redeploy.`;
    case "upstream":
      return "The LLM provider returned an error. Check server logs and your API quota.";
    default:
      return "Failed to get a response from the LLM. Please try again.";
  }
}

export function formatLlmErrorMessage(error: Error | undefined): string {
  if (!error?.message) {
    return "Failed to send message. Please try again.";
  }

  const message = error.message.trim();
  const lower = message.toLowerCase();

  if (lower === "network error" || lower.includes("failed to fetch")) {
    const keyEnv = getKeyEnvLabel();
    return `Connection to the LLM failed. Confirm ${keyEnv}, LLM_PROVIDER, and redeploy after env changes.`;
  }

  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("aborted")
  ) {
    return toUserFacingLlmMessage(classifyLlmError(error));
  }

  if (lower.includes("401") || lower.includes("403")) {
    return toUserFacingLlmMessage("upstream_auth");
  }

  return message;
}
