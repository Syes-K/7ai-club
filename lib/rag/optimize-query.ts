import { generateText } from "ai";
import {
  getChatModelForResolvedConfig,
  type ResolvedUserModel,
} from "@/lib/llm/provider";
import { getLlmTimeoutMs } from "@/lib/llm/timeout";

export function buildRagOptimizePrompt(userText: string): string {
  return `Rewrite the user message into a concise search query for retrieving relevant documents from a knowledge base.
Return only the optimized query text without quotes or explanation.

User message:
${userText}`;
}

export async function optimizeRagQuery(
  userText: string,
  resolved: ResolvedUserModel,
): Promise<string> {
  const trimmed = userText.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    const result = await generateText({
      model: getChatModelForResolvedConfig(resolved),
      prompt: buildRagOptimizePrompt(trimmed),
      maxOutputTokens: 256,
      abortSignal: AbortSignal.timeout(getLlmTimeoutMs()),
    });

    return result.text.trim() || trimmed;
  } catch {
    return trimmed;
  }
}
