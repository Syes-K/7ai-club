import type { ChatMessage } from "@/lib/chat/types";

export const DEFAULT_LOG_DEBUG_INSTRUCTION =
  "请根据上述对话或消息列表简要归纳要点，并指出可能的问题或异常。";

/**
 * 将日志行中的 `messages` 解析为 role/content 列表；格式不符时返回 `null`。
 */
export function tryParseLogMessagesAsChat(
  raw: unknown
): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const o = item as Record<string, unknown>;
    if (typeof o.role !== "string" || typeof o.content !== "string") {
      return null;
    }
    if (o.role !== "user" && o.role !== "assistant" && o.role !== "system") {
      return null;
    }
    out.push({ role: o.role, content: o.content });
  }
  return out;
}

/**
 * 前端组装发给 `/api/debug` 的 messages（再经服务端 slice）。
 */
export function buildLogDebugMessages(
  messagesPayload: unknown,
  instruction: string | undefined,
  maxMessagesInContext: number
): ChatMessage[] {
  const instr = instruction?.trim() || DEFAULT_LOG_DEBUG_INSTRUCTION;
  const K = maxMessagesInContext;
  const parsed = tryParseLogMessagesAsChat(messagesPayload);
  if (parsed && parsed.length > 0) {
    const base = parsed.slice(-Math.max(1, K - 1));
    const combined: ChatMessage[] = [
      ...base,
      { role: "user", content: instr },
    ];
    return combined.slice(-K);
  }
  const blob = JSON.stringify(messagesPayload, null, 2);
  return [
    {
      role: "user",
      content: `${instr}\n\n以下为日志中的原始数据（JSON）：\n\`\`\`json\n${blob}\n\`\`\``,
    },
  ];
}
