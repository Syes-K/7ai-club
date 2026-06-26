import type { ResolvedUserModel, UserLlmProviderId } from "@/lib/llm/provider";
import { getProviderBaseUrl } from "@/lib/llm/provider";

type ChatCompletionMessage = {
  content?: string | null;
  reasoning_content?: string | null;
};

type ChatCompletionResponse = {
  choices?: Array<{ message?: ChatCompletionMessage }>;
  error?: { message?: string };
};

const CONNECTIVITY_TEST_BODY_EXTRAS: Record<UserLlmProviderId, Record<string, unknown>> =
  {
    bailian: { enable_thinking: false },
    deepseek: { thinking: { type: "disabled" } },
    openai: {},
    siliconflow: {},
  };

const CONNECTIVITY_TEST_TIMEOUT_MS = 30_000;
const CONNECTIVITY_TEST_MAX_TOKENS = 64;

export function getConnectivityTestBodyExtras(
  provider: UserLlmProviderId,
): Record<string, unknown> {
  return CONNECTIVITY_TEST_BODY_EXTRAS[provider];
}

export function extractConnectivityProbeText(
  response: ChatCompletionResponse,
): string {
  const message = response.choices?.[0]?.message;
  const content =
    typeof message?.content === "string" ? message.content.trim() : "";
  if (content) {
    return content;
  }

  const reasoning =
    typeof message?.reasoning_content === "string"
      ? message.reasoning_content.trim()
      : "";
  return reasoning;
}

export async function probeProviderChatCompletion(
  resolved: ResolvedUserModel,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const url = `${getProviderBaseUrl(resolved.provider).replace(/\/$/, "")}/chat/completions`;
  const body = {
    model: resolved.modelName,
    messages: [{ role: "user", content: "Hi" }],
    max_tokens: CONNECTIVITY_TEST_MAX_TOKENS,
    stream: false,
    ...getConnectivityTestBodyExtras(resolved.provider),
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolved.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(CONNECTIVITY_TEST_TIMEOUT_MS),
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${raw}`.trim());
  }

  let parsed: ChatCompletionResponse;
  try {
    parsed = JSON.parse(raw) as ChatCompletionResponse;
  } catch {
    throw new Error("Invalid JSON response from provider");
  }

  if (parsed.error?.message?.trim()) {
    throw new Error(parsed.error.message.trim());
  }

  const text = extractConnectivityProbeText(parsed);
  if (!text) {
    return { ok: false, error: "Empty response from provider" };
  }

  return { ok: true, text };
}
