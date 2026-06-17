import type { AssistantRow } from "@/lib/console/assistants";

export const ASSISTANT_ICON_MAX_LENGTH = 16;
export const ASSISTANT_OPENING_MESSAGE_MAX_LENGTH = 2000;

export function normalizeAssistantIcon(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

export function normalizeOpeningMessage(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

export function validateAssistantIcon(value: string | null): string | null {
  if (value == null) return null;
  if (value.length > ASSISTANT_ICON_MAX_LENGTH) {
    return `Icon must be ${ASSISTANT_ICON_MAX_LENGTH} characters or fewer`;
  }
  return null;
}

export function validateOpeningMessage(value: string | null): string | null {
  if (value == null) return null;
  if (value.length > ASSISTANT_OPENING_MESSAGE_MAX_LENGTH) {
    return `Opening message must be ${ASSISTANT_OPENING_MESSAGE_MAX_LENGTH} characters or fewer`;
  }
  return null;
}

export function serializeAssistant(row: AssistantRow) {
  return {
    id: row.id,
    icon: row.icon,
    name: row.name,
    openingMessage: row.opening_message,
    systemPrompt: row.system_prompt,
    updatedAt: row.updated_at,
  };
}

export type AssistantFormValues = {
  icon: string | null;
  name: string;
  openingMessage: string | null;
  systemPrompt: string;
};

export function parseAssistantFormBody(body: {
  icon?: unknown;
  name?: unknown;
  openingMessage?: unknown;
  systemPrompt?: unknown;
}): { values?: AssistantFormValues; error?: string } {
  const fields: Partial<AssistantFormValues> = {};

  if ("icon" in body) {
    if (body.icon != null && typeof body.icon !== "string") {
      return { error: "Invalid icon" };
    }
    const icon = normalizeAssistantIcon(
      typeof body.icon === "string" ? body.icon : null,
    );
    const iconError = validateAssistantIcon(icon);
    if (iconError) return { error: iconError };
    fields.icon = icon;
  }

  if ("name" in body) {
    if (typeof body.name !== "string") {
      return { error: "Invalid name" };
    }
    const name = body.name.trim();
    if (!name || name.length > 64) {
      return { error: "Invalid name" };
    }
    fields.name = name;
  }

  if ("openingMessage" in body) {
    if (body.openingMessage != null && typeof body.openingMessage !== "string") {
      return { error: "Invalid opening message" };
    }
    const openingMessage = normalizeOpeningMessage(
      typeof body.openingMessage === "string" ? body.openingMessage : null,
    );
    const openingError = validateOpeningMessage(openingMessage);
    if (openingError) return { error: openingError };
    fields.openingMessage = openingMessage;
  }

  if ("systemPrompt" in body) {
    if (typeof body.systemPrompt !== "string") {
      return { error: "Invalid system prompt" };
    }
    const systemPrompt = body.systemPrompt.trim();
    if (!systemPrompt) {
      return { error: "System prompt is required" };
    }
    fields.systemPrompt = systemPrompt;
  }

  if (Object.keys(fields).length === 0) {
    return { error: "No fields to update" };
  }

  return { values: fields as AssistantFormValues };
}
