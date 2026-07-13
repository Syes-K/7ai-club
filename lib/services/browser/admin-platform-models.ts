import type { ModelConfigDto } from "@/lib/data/types";
import { parseCreateModelBody, parseUpdateModelKeyBody, parseUpdateModelMetadataBody } from "@/lib/validation/model-config";
import type { UserLlmProviderId } from "@/lib/llm/provider";

async function readError(response: Response): Promise<string> {
  const text = await response.text();
  return text || `Request failed (${response.status})`;
}

export async function listAdminPlatformModels(): Promise<ModelConfigDto[]> {
  const response = await fetch("/api/admin/models");
  if (!response.ok) throw new Error(await readError(response));
  const data = (await response.json()) as { configs: ModelConfigDto[] };
  return data.configs;
}

export async function createAdminPlatformModel(body: {
  provider: unknown;
  modelName: unknown;
  modelType?: unknown;
  embeddingDimensions?: unknown;
  apiKey: unknown;
}): Promise<ModelConfigDto> {
  const parsed = parseCreateModelBody(body);
  if (parsed.error || !parsed.fields) {
    throw new Error(parsed.error ?? "Invalid request");
  }

  const response = await fetch("/api/admin/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.fields),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as ModelConfigDto;
}

export async function updateAdminPlatformModelMetadata(
  id: string,
  body: {
    provider?: unknown;
    modelName?: unknown;
    embeddingDimensions?: unknown;
  },
): Promise<ModelConfigDto> {
  const parsed = parseUpdateModelMetadataBody(body);
  if (parsed.error) throw new Error(parsed.error);

  const response = await fetch(`/api/admin/models/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.fields ?? {}),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as ModelConfigDto;
}

export async function updateAdminPlatformModelKey(
  id: string,
  apiKey: string,
): Promise<ModelConfigDto> {
  const parsed = parseUpdateModelKeyBody({ apiKey });
  if (parsed.error || !parsed.apiKey) {
    throw new Error(parsed.error ?? "Invalid request");
  }

  const response = await fetch(`/api/admin/models/${id}/key`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: parsed.apiKey }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as ModelConfigDto;
}

export async function testAdminPlatformModel(id: string): Promise<ModelConfigDto> {
  const response = await fetch(`/api/admin/models/${id}/test`, { method: "POST" });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as ModelConfigDto;
}

export async function deleteAdminPlatformModel(id: string): Promise<void> {
  const response = await fetch(`/api/admin/models/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(await readError(response));
}

export async function disableAdminPlatformModel(id: string): Promise<ModelConfigDto> {
  const response = await fetch(`/api/admin/models/${id}/disable`, { method: "POST" });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as ModelConfigDto;
}

export async function enableAdminPlatformModel(id: string): Promise<ModelConfigDto> {
  const response = await fetch(`/api/admin/models/${id}/enable`, { method: "POST" });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as ModelConfigDto;
}

export type { UserLlmProviderId };
