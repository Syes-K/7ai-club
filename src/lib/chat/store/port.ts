import type { ChatMessage } from "../types";

export type SessionSummary = {
  id: string;
  title: string | null;
  updatedAt: number;
};

export type StoredMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
};

/**
 * 对话持久化端口：默认实现为 SQLite，可替换为 PostgreSQL 等适配器。
 */
export interface ChatStore {
  listSessions(): SessionSummary[];
  createSession(): { id: string };
  sessionExists(id: string): boolean;
  listMessages(sessionId: string): StoredMessage[];
  appendMessage(
    sessionId: string,
    role: "user" | "assistant" | "system",
    content: string
  ): { id: string };
  clearMessages(sessionId: string): void;
  /** 删除会话及其消息（级联） */
  deleteSession(sessionId: string): boolean;
  /** 会话尚无标题时，用首条用户话节选设置标题 */
  maybeSetTitleFromUserMessage(sessionId: string, userContent: string): void;
  touchSession(sessionId: string): void;
}

export function storedToChatMessages(rows: StoredMessage[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const r of rows) {
    if (r.role === "user" || r.role === "assistant" || r.role === "system") {
      out.push({ role: r.role, content: r.content });
    }
  }
  return out;
}
