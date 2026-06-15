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
  if (!error?.message) {
    return "Failed to send message. Please try again.";
  }

  const message = error.message.trim();
  const lower = message.toLowerCase();

  if (lower === "network error" || lower.includes("failed to fetch")) {
    return "LLM request timed out or was interrupted. On Vercel: confirm API key matches local (NVIDIA_API_KEY / BAILIAN_API_KEY / SILICONFLOW_API_KEY), try a faster model, or switch LLM_PROVIDER. Redeploy after env changes.";
  }

  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("aborted")) {
    return "LLM request timed out. Try LLM_MODEL=deepseek-ai/deepseek-v4-flash, or switch to LLM_PROVIDER=siliconflow.";
  }

  return message;
}
