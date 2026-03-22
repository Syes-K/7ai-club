import type { AppConfig } from "@/lib/config/defaults";
import { fetchChatCompletionText } from "./providers";
import { logChat } from "./logger";
import type { ChatStore, StoredMessage } from "./store/port";
import { storedToChatMessages } from "./store/port";
import type { ChatMessage, ChatProviderId } from "./types";

function buildContextSummarySystemPrompt(maxChars: number): string {
  return `你是对话摘要助手。用户将提供一段较早的多轮对话文本。请用简洁中文压缩为一段连续摘要，保留：关键事实、专有名词、用户约束与已达成共识的决策。不要编造。不要使用 markdown 标题。

【长度】输出正文总长度必须不超过 ${maxChars} 个字符（与常见语言中字符串的字符长度计数一致，含标点与空格）。若难以在限制内覆盖全部细节，请优先保留最关键信息，并自然收尾，避免像在句子中途被截断。不要输出字数统计或任何与摘要正文无关的说明。`;
}

/** 与 `spec-chat-context-summary.md` §2 一致 */
export const CONTEXT_SUMMARY_MODEL_PREFIX = `以下是本对话更早内容的摘要，供你理解上下文（用户界面上的消息列表中仍有完整原文可供其查阅）：\n`;

export function messagesIncludeContextSummary(
  messages: ChatMessage[]
): boolean {
  return (
    messages.length > 0 &&
    messages[0].role === "system" &&
    messages[0].content.startsWith(CONTEXT_SUMMARY_MODEL_PREFIX)
  );
}

export function buildMessagesWithContextSummary(
  rows: StoredMessage[],
  store: ChatStore,
  sessionId: string,
  config: AppConfig
): ChatMessage[] {
  const chat = storedToChatMessages(rows);
  const K = config.maxMessagesInContext;
  const tail = chat.slice(-K);
  if (!config.contextSummaryEnabled || chat.length <= K) {
    return tail;
  }
  const { summary } = store.getSessionContextSummary(sessionId);
  const s = summary?.trim();
  if (!s) {
    return tail;
  }
  return [
    { role: "system", content: `${CONTEXT_SUMMARY_MODEL_PREFIX}${s}` },
    ...tail,
  ];
}

export function shouldRefreshContextSummary(
  n: number,
  K: number,
  summaryMessageCountAtRefresh: number,
  refreshEvery: number,
  enabled: boolean
): boolean {
  if (!enabled || n <= K) return false;
  if (summaryMessageCountAtRefresh <= 0) return true;
  return n - summaryMessageCountAtRefresh >= refreshEvery;
}

/** 整段重写：以当前窗口外全部消息为输入生成摘要（PRD §2.1.1） */
export async function refreshContextSummaryFullRewrite(params: {
  sessionId: string;
  store: ChatStore;
  requestId: string;
  provider: ChatProviderId;
  model: string | undefined;
  config: AppConfig;
}): Promise<void> {
  const { sessionId, store, requestId, provider, model, config } = params;
  const rows = store.listMessages(sessionId);
  const n = rows.length;
  const K = config.maxMessagesInContext;
  if (n <= K) {
    store.setSessionContextSummary(sessionId, null, 0);
    return;
  }
  const prefixRows = rows.slice(0, n - K);
  let prefixText = prefixRows
    .map((r) =>
      r.role === "user"
        ? `用户: ${r.content}`
        : r.role === "assistant"
          ? `助手: ${r.content}`
          : `系统: ${r.content}`
    )
    .join("\n\n");
  const MAX_PREFIX_CHARS = 120_000;
  if (prefixText.length > MAX_PREFIX_CHARS) {
    await logChat("warn", "context_summary.prefix_truncated", {
      requestId,
      sessionId,
      originalLen: prefixText.length,
    });
    prefixText = prefixText.slice(-MAX_PREFIX_CHARS);
  }
  const maxChars = config.contextSummaryMaxChars;
  const messages: ChatMessage[] = [
    { role: "system", content: buildContextSummarySystemPrompt(maxChars) },
    { role: "user", content: prefixText },
  ];
  const maxTokens = Math.min(
    4096,
    Math.ceil(maxChars / 2) + 512
  );
  try {
    const text = await fetchChatCompletionText({
      provider,
      model,
      messages,
      requestId: `${requestId}-summary`,
      maxTokens,
    });
    const trimmed = text.trim();
    store.setSessionContextSummary(sessionId, trimmed, n);
    await logChat("info", "context_summary.refreshed", {
      requestId,
      sessionId,
      messageCount: n,
      summary: trimmed,
      summaryLen: trimmed.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await logChat("warn", "context_summary.refresh_failed", {
      requestId,
      sessionId,
      error: message,
    });
    const prev = store.getSessionContextSummary(sessionId);
    store.setSessionContextSummary(sessionId, prev.summary, n);
  }
}
