import type {
  AssistantInput,
  AssistantListItem,
  AssistantPublicItem,
  AssistantRow,
} from "@/lib/assistants/types";
import type { ChatMessage } from "../types";

export type SessionSummary = {
  id: string;
  title: string | null;
  updatedAt: number;
  assistantId: string | null;
  assistantName: string | null;
  assistantIcon: string | null;
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
  /** 新建会话；`assistantId` 存在时写入助手快照列 */
  createSession(options?: { assistantId?: string | null }): { id: string };
  sessionExists(id: string): boolean;
  /** 会话绑定的助手提示快照，供意图路由注入 system */
  getSessionAssistantPromptSnapshot(sessionId: string): string | null;
  listMessages(sessionId: string): StoredMessage[];
  appendMessage(
    sessionId: string,
    role: "user" | "assistant" | "system",
    content: string
  ): { id: string };
  clearMessages(sessionId: string): void;
  /** 会话级上下文摘要（模型用）；与 `summaryMessageCountAtRefresh` 成对使用 */
  getSessionContextSummary(sessionId: string): {
    summary: string | null;
    /** 上次成功生成摘要时的持久化消息条数；0 表示从未成功摘要 */
    summaryMessageCountAtRefresh: number;
  };
  setSessionContextSummary(
    sessionId: string,
    summary: string | null,
    messageCountAtRefresh: number
  ): void;
  /** 删除会话及其消息（级联） */
  deleteSession(sessionId: string): boolean;
  /** 会话尚无标题时，用首条用户话节选设置标题 */
  maybeSetTitleFromUserMessage(sessionId: string, userContent: string): void;
  touchSession(sessionId: string): void;

  listAssistants(): AssistantListItem[];
  /** 对话页新建会话用：无 prompt，含开场白全文 */
  listAssistantsPublic(): AssistantPublicItem[];
  getAssistant(id: string): AssistantRow | null;
  createAssistantRow(input: AssistantInput): { id: string };
  updateAssistantRow(id: string, input: AssistantInput): boolean;
  deleteAssistantRow(id: string): boolean;
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
