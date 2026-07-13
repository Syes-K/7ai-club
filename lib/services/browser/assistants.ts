import {
  createAssistant,
  deleteAssistant,
  listPlatformAssistants,
  listUserAssistants,
  loadAssistantKnowledgeBaseIds,
  saveAssistantKnowledgeBaseIds,
  updateAssistant,
} from "@/lib/data/browser/assistants";
import type { AssistantDto, AssistantOption, AssistantRow } from "@/lib/data/types";
import { mapRpcError } from "@/lib/data/errors";
import { PLATFORM_DEFAULT_MODEL_NAME } from "@/lib/constants/model-providers";
import {
  parseAssistantFormBody,
  validateAssistantCreate,
} from "@/lib/validation/assistant";

function toAssistantDto(
  row: AssistantRow,
  knowledgeBaseIds: string[] = [],
): AssistantDto {
  return {
    id: row.id,
    icon: row.icon,
    name: row.name,
    openingMessage: row.opening_message,
    systemPrompt: row.system_prompt,
    updatedAt: row.updated_at,
    knowledgeBaseIds,
  };
}

function toAssistantOption(row: AssistantRow, isPlatform: boolean): AssistantOption {
  return {
    id: row.id,
    icon: row.icon,
    name: row.name,
    isPlatform,
  };
}

export async function listAssistants(): Promise<AssistantDto[]> {
  const rows = await listUserAssistants();
  return rows.map((row) => toAssistantDto(row));
}

export async function listAssistantOptions(): Promise<AssistantOption[]> {
  const [personal, platform] = await Promise.all([
    listUserAssistants(),
    listPlatformAssistants(),
  ]);

  return [
    ...personal.map((row) => toAssistantOption(row, false)),
    ...platform.map((row) => toAssistantOption(row, true)),
  ];
}

export async function createUserAssistant(values: {
  icon: string | null;
  name: string;
  openingMessage: string | null;
  systemPrompt: string;
  knowledgeBaseIds?: string[];
}): Promise<AssistantDto> {
  const validationError = validateAssistantCreate(values);
  if (validationError) {
    throw new Error(validationError);
  }

  const row = await createAssistant({
    name: values.name,
    systemPrompt: values.systemPrompt,
    icon: values.icon,
    openingMessage: values.openingMessage,
    model: PLATFORM_DEFAULT_MODEL_NAME,
  });

  const kbIds = values.knowledgeBaseIds ?? [];
  await saveAssistantKnowledgeBaseIds(row.id, kbIds);

  return toAssistantDto(row, kbIds);
}

export async function updateUserAssistant(
  assistantId: string,
  body: Record<string, unknown>,
): Promise<AssistantDto> {
  const parsed = parseAssistantFormBody(body);
  if (parsed.error || !parsed.values) {
    throw new Error(parsed.error ?? "Invalid request");
  }

  const row = await updateAssistant(assistantId, {
    name: parsed.values.name,
    systemPrompt: parsed.values.systemPrompt,
    icon: parsed.values.icon,
    openingMessage: parsed.values.openingMessage,
  });

  const kbIds = Array.isArray(body.knowledgeBaseIds)
    ? (body.knowledgeBaseIds as unknown[]).filter(
        (id): id is string => typeof id === "string",
      )
    : await loadAssistantKnowledgeBaseIds(assistantId);

  if ("knowledgeBaseIds" in body) {
    await saveAssistantKnowledgeBaseIds(assistantId, kbIds);
  }

  return toAssistantDto(row, kbIds);
}

export async function getAssistantKnowledgeBaseIdsForEdit(
  assistantId: string,
): Promise<string[]> {
  return loadAssistantKnowledgeBaseIds(assistantId);
}

export async function deleteUserAssistant(assistantId: string): Promise<void> {
  try {
    await deleteAssistant(assistantId);
  } catch (error) {
    throw new Error(mapRpcError(error));
  }
}
