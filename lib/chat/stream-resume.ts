import type { UIMessage } from "ai";

/**
 * Resume only when the latest turn has no assistant reply in initial messages.
 * If an assistant was already persisted (e.g. LLM finished but run cleanup pending),
 * replaying the resumable stream would push a second assistant bubble (ID mismatch).
 */
export function shouldResumeChatStream(messages: UIMessage[]): boolean {
  const lastMessage = messages.at(-1);
  if (!lastMessage) {
    return false;
  }

  return lastMessage.role === "user";
}
