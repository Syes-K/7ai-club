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
    return "Connection failed. On Vercel, check NVIDIA_API_KEY (or SILICONFLOW_API_KEY), LLM_PROVIDER, and redeploy. Hobby plan limits functions to 10s — try deepseek-v4-flash or upgrade to Pro.";
  }

  return message;
}
