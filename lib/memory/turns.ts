import type { DbMessageWithArchive } from "@/lib/data/types";
import type { CompleteTurn } from "@/lib/memory/types";

export function partitionIntoTurns(
  messages: DbMessageWithArchive[],
): CompleteTurn[] {
  const turns: CompleteTurn[] = [];
  let index = 0;

  while (index < messages.length - 1) {
    const user = messages[index];
    const assistant = messages[index + 1];

    if (user.role === "user" && assistant.role === "assistant") {
      turns.push({ user, assistant });
      index += 2;
      continue;
    }

    index += 1;
  }

  return turns;
}

export function countCompleteTurns(messages: DbMessageWithArchive[]): number {
  return partitionIntoTurns(messages).length;
}
