import type { AssistantRow } from "@/lib/data/types";
import {
  ASSISTANT_ICON_MAX_LENGTH,
  ASSISTANT_OPENING_MESSAGE_MAX_LENGTH,
  normalizeAssistantIcon,
  normalizeOpeningMessage,
  parseAssistantFormBody,
  validateAssistantIcon,
  validateOpeningMessage,
  type AssistantFormValues,
} from "@/lib/validation/assistant";

export {
  ASSISTANT_ICON_MAX_LENGTH,
  ASSISTANT_OPENING_MESSAGE_MAX_LENGTH,
  normalizeAssistantIcon,
  normalizeOpeningMessage,
  parseAssistantFormBody,
  validateAssistantIcon,
  validateOpeningMessage,
  type AssistantFormValues,
};

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
