import {
  deleteUserModelConfig,
  getUserProfilePreferenceConfigId,
  listUserModelConfigRows,
  updateUserModelConfig,
} from "@/lib/data/browser/model-configs";
import type { ModelConfigDto } from "@/lib/data/types";
import {
  mergePlatformDefault,
  rowToModelConfigDto,
  toPassedModelOptions,
} from "@/lib/console/model-configs";
import {
  parseCreateModelBody,
  parseUpdateModelKeyBody,
  parseUpdateModelMetadataBody,
} from "@/lib/validation/model-config";
import type { UserLlmProviderId } from "@/lib/llm/provider";

async function readErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  return text || `Request failed (${response.status})`;
}

export async function listModelConfigs(): Promise<ModelConfigDto[]> {
  const rows = await listUserModelConfigRows();
  return mergePlatformDefault(rows);
}

export async function listPassedModelOptions() {
  const configs = await listModelConfigs();
  return toPassedModelOptions(configs);
}

export async function createModelConfig(body: {
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

  const response = await fetch("/api/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.fields),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const data = (await response.json()) as ModelConfigDto;
  return data;
}

export async function updateModelConfigMetadata(
  id: string,
  body: {
    provider?: unknown;
    modelName?: unknown;
    embeddingDimensions?: unknown;
  },
): Promise<ModelConfigDto> {
  const parsed = parseUpdateModelMetadataBody(body);
  if (parsed.error || !parsed.fields) {
    throw new Error(parsed.error ?? "Invalid request");
  }

  const row = await updateUserModelConfig(id, {
    provider: parsed.fields.provider as UserLlmProviderId | undefined,
    modelName: parsed.fields.modelName,
    embeddingDimensions: parsed.fields.embeddingDimensions,
  });

  return rowToModelConfigDto(row);
}

export async function updateModelConfigKey(
  id: string,
  apiKey: string,
): Promise<ModelConfigDto> {
  const parsed = parseUpdateModelKeyBody({ apiKey });
  if (parsed.error || !parsed.apiKey) {
    throw new Error(parsed.error ?? "Invalid request");
  }

  const response = await fetch(`/api/models/${id}/key`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: parsed.apiKey }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as ModelConfigDto;
}

export async function testModelConfig(id: string): Promise<ModelConfigDto> {
  const response = await fetch(`/api/models/${id}/test`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as ModelConfigDto;
}

export async function deleteModelConfig(id: string): Promise<void> {
  const preferenceId = await getUserProfilePreferenceConfigId();
  if (preferenceId === id) {
    throw new Error(
      "This model is your current preference. Choose another model in Profile first.",
    );
  }

  await deleteUserModelConfig(id);
}
