import type { UIMessage } from "ai";

function findLastUserIndex(messages: UIMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return index;
    }
  }

  return -1;
}

/** Assistant message for the current turn (must appear after the latest user message). */
export function findTurnAssistantMessage(
  messages: UIMessage[],
): UIMessage | undefined {
  const lastUserIndex = findLastUserIndex(messages);
  if (lastUserIndex === -1) {
    return undefined;
  }

  for (let index = messages.length - 1; index > lastUserIndex; index -= 1) {
    if (messages[index]?.role === "assistant") {
      return messages[index];
    }
  }

  return undefined;
}
