import {
  createAssistant,
  deleteAssistant,
  ensureUserAssistants,
  getPlatformTemplateModel,
  updateAssistant,
} from "@/lib/data/browser/assistants";
import type { AssistantDto, AssistantOption, AssistantRow } from "@/lib/data/types";
import { mapRpcError } from "@/lib/data/errors";
import {
  parseAssistantFormBody,
  validateAssistantCreate,
} from "@/lib/validation/assistant";

function toAssistantDto(row: AssistantRow): AssistantDto {
  return {
    id: row.id,
    icon: row.icon,
    name: row.name,
    openingMessage: row.opening_message,
    systemPrompt: row.system_prompt,
    updatedAt: row.updated_at,
  };
}

function toAssistantOption(row: AssistantRow): AssistantOption {
  return {
    id: row.id,
    icon: row.icon,
    name: row.name,
  };
}

export async function listAssistants(): Promise<AssistantDto[]> {
  const rows = await ensureUserAssistants();
  return rows.map(toAssistantDto);
}

export async function listAssistantOptions(): Promise<AssistantOption[]> {
  const rows = await ensureUserAssistants();
  return rows.map(toAssistantOption);
}

export async function createUserAssistant(values: {
  icon: string | null;
  name: string;
  openingMessage: string | null;
  systemPrompt: string;
}): Promise<AssistantDto> {
  const validationError = validateAssistantCreate(values);
  if (validationError) {
    throw new Error(validationError);
  }

  const model = await getPlatformTemplateModel();
  const row = await createAssistant({
    name: values.name,
    systemPrompt: values.systemPrompt,
    icon: values.icon,
    openingMessage: values.openingMessage,
    model,
  });

  return toAssistantDto(row);
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

  return toAssistantDto(row);
}

export async function deleteUserAssistant(assistantId: string): Promise<void> {
  try {
    await deleteAssistant(assistantId);
  } catch (error) {
    throw new Error(mapRpcError(error));
  }
}
