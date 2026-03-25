import type { AppConfig } from "@/lib/config/defaults";
import {
  contextSummaryInjectUsesContentPlaceholder,
  getPromptTemplatesMerged,
  renderPromptTemplate,
  renderTemplateString,
} from "@/lib/prompt-templates";
import { fetchChatCompletionText } from "@/lib/provider/providers";
import { logChat } from "./logger";
import type { ChatStore, StoredMessage } from "./store/port";
import { storedToChatMessages } from "./store/port";
import type { ChatMessage } from "./types";
import type { ChatProviderId } from "@/lib/provider/types";

function contextSummaryInjectDetectionPrefix(): string {
  const t = getPromptTemplatesMerged().contextSummaryInjectPrefix;
  if (contextSummaryInjectUsesContentPlaceholder(t)) {
    return renderTemplateString(t, { content: "" });
  }
  return renderTemplateString(t, {});
}

function buildContextSummaryInjectMessageBody(summary: string): string {
  const t = getPromptTemplatesMerged().contextSummaryInjectPrefix;
  if (contextSummaryInjectUsesContentPlaceholder(t)) {
    return renderTemplateString(t, { content: summary });
  }
  return renderTemplateString(t, {}) + summary;
}

function buildContextSummarySystemPrompt(maxChars: number): string {
  return renderPromptTemplate("contextSummarySystem", { maxChars });
}

export function messagesIncludeContextSummary(
  messages: ChatMessage[]
): boolean {
  const prefix = contextSummaryInjectDetectionPrefix();
  return (
    messages.length > 0 &&
    messages[0].role === "system" &&
    messages[0].content.startsWith(prefix)
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
    { role: "system", content: buildContextSummaryInjectMessageBody(s) },
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

/** 整段重写：以当前会话全部持久化消息为输入生成摘要（与尾窗重叠，避免摘要边界与尾窗滑动错位导致的信息空洞） */
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
  let dialogueText = rows
    .map((r) =>
      r.role === "user"
        ? `用户: ${r.content}`
        : r.role === "assistant"
          ? `助手: ${r.content}`
          : `系统: ${r.content}`
    )
    .join("\n\n");
  const MAX_DIALOGUE_CHARS = 120_000;
  if (dialogueText.length > MAX_DIALOGUE_CHARS) {
    await logChat("warn", "context_summary.prefix_truncated", {
      requestId,
      sessionId,
      originalLen: dialogueText.length,
    });
    dialogueText = dialogueText.slice(-MAX_DIALOGUE_CHARS);
  }
  const maxChars = config.contextSummaryMaxChars;
  const messages: ChatMessage[] = [
    { role: "system", content: buildContextSummarySystemPrompt(maxChars) },
    { role: "user", content: dialogueText },
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
