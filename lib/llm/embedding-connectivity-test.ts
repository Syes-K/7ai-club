import type { ResolvedUserModel } from "@/lib/llm/provider";
import { getProviderBaseUrl } from "@/lib/llm/provider";

type EmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
  error?: { message?: string };
};

const CONNECTIVITY_TEST_TIMEOUT_MS = 30_000;

export async function probeProviderEmbedding(
  resolved: ResolvedUserModel,
  options?: { dimensions?: number },
): Promise<
  | { ok: true; dimensions: number }
  | { ok: false; error: string }
> {
  const url = `${getProviderBaseUrl(resolved.provider).replace(/\/$/, "")}/embeddings`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolved.apiKey}`,
    },
    body: JSON.stringify({
      model: resolved.modelName,
      input: ["connectivity test"],
      encoding_format: "float",
    }),
    signal: AbortSignal.timeout(CONNECTIVITY_TEST_TIMEOUT_MS),
  });

  const raw = await response.text();

  if (!response.ok) {
    return { ok: false, error: `${response.status} ${raw}`.trim() };
  }

  let parsed: EmbeddingResponse;
  try {
    parsed = JSON.parse(raw) as EmbeddingResponse;
  } catch {
    return { ok: false, error: "Invalid JSON response from provider" };
  }

  if (parsed.error?.message?.trim()) {
    return { ok: false, error: parsed.error.message.trim() };
  }

  const vector = parsed.data?.[0]?.embedding;
  if (!vector?.length) {
    return { ok: false, error: "Empty embedding response from provider" };
  }

  if (options?.dimensions && vector.length !== options.dimensions) {
    return {
      ok: false,
      error: `Expected dimension ${options.dimensions}, got ${vector.length}`,
    };
  }

  return { ok: true, dimensions: vector.length };
}
