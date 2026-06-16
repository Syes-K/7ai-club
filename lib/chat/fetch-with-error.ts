import { formatLlmErrorMessage } from "@/lib/llm/errors";

/** Surfaces non-stream API errors instead of a generic "network error". */
export async function chatFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);

  if (!response.ok) {
    const text = (await response.text().catch(() => "")).trim();
    throw new Error(text || `Chat request failed (${response.status})`);
  }

  return response;
}

export function formatChatErrorMessage(error: Error | undefined): string {
  return formatLlmErrorMessage(error);
}
