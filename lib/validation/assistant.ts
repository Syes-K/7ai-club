export const ASSISTANT_ICON_MAX_LENGTH = 16;
export const ASSISTANT_OPENING_MESSAGE_MAX_LENGTH = 2000;
export const ASSISTANT_NAME_MAX_LENGTH = 64;

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
    if (!name || name.length > ASSISTANT_NAME_MAX_LENGTH) {
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

export function validateAssistantCreate(values: {
  icon: string | null;
  name: string;
  openingMessage: string | null;
  systemPrompt: string;
}): string | null {
  const name = values.name.trim();
  if (!name || name.length > ASSISTANT_NAME_MAX_LENGTH) {
    return "Invalid name";
  }

  if (!values.systemPrompt.trim()) {
    return "System prompt is required";
  }

  const iconError = validateAssistantIcon(values.icon);
  if (iconError) return iconError;

  const openingError = validateOpeningMessage(values.openingMessage);
  if (openingError) return openingError;

  return null;
}
