import type { DbMessageWithArchive } from "@/lib/data/types";

export function buildSummaryPrompt(options: {
  priorSummary: string | null;
  messagesToArchive: DbMessageWithArchive[];
}): string {
  const archivedConversation = options.messagesToArchive
    .map((message) => `[${message.role}] ${message.content}`)
    .join("\n\n");

  const priorBlock = options.priorSummary
    ? `## Prior conversation memory\n${options.priorSummary}\n\n`
    : "";

  return `${priorBlock}## Messages to merge into updated memory\n${archivedConversation}

Write an updated **Conversation memory** in English for the LLM. Use concise structured bullets covering:
- User goals and context
- Decisions made
- Key facts and proper nouns
- Open questions

Do NOT include API keys, tokens, passwords, or secrets.
Merge prior memory with new messages (do not append a single sentence only).`;
}
