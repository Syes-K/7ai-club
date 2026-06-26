import type { JSONValue } from "ai";
import type { ResolvedUserModel, UserLlmProviderId } from "@/lib/llm/provider";

const REASONING_CAPABLE_PROVIDERS = new Set<UserLlmProviderId>([
  "bailian",
  "deepseek",
]);

const REASONING_MODEL_PATTERNS = [
  /qwq/i,
  /deepseek-r1/i,
  /deepseek-v4/i,
  /deepseek-reasoner/i,
  /thinking/i,
  /^qwen3/i,
] as const;

export function supportsReasoning(resolved: ResolvedUserModel): boolean {
  if (!REASONING_CAPABLE_PROVIDERS.has(resolved.provider)) {
    return false;
  }

  return REASONING_MODEL_PATTERNS.some((pattern) =>
    pattern.test(resolved.modelName),
  );
}

/** Passthrough body fields for openai-compatible clients (not OpenAI SDK schema). */
export function getStreamTextProviderOptions(
  resolved: ResolvedUserModel,
): Record<string, Record<string, JSONValue>> | undefined {
  if (resolved.provider === "bailian") {
    return {
      bailian: {
        enable_thinking: supportsReasoning(resolved),
      },
    };
  }

  if (resolved.provider === "deepseek") {
    return {
      deepseek: {
        thinking: {
          type: supportsReasoning(resolved) ? "enabled" : "disabled",
        },
      },
    };
  }

  return undefined;
}
