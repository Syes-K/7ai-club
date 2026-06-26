import type { UIMessage } from "ai";
import type { DbMessageWithArchive } from "@/lib/data/types";
import { dbMessageToUIMessage } from "@/lib/chat/conversations";

export function buildLlmUiMessages(
  dbMessages: DbMessageWithArchive[],
): UIMessage[] {
  return dbMessages
    .filter((message) => message.summarized_at == null)
    .map(dbMessageToUIMessage);
}

export function filterActiveDbMessages(
  dbMessages: DbMessageWithArchive[],
): DbMessageWithArchive[] {
  return dbMessages.filter((message) => message.summarized_at == null);
}
