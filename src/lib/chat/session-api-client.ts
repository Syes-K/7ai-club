/**
 * 浏览器端调用会话 API（勿从此文件导入服务端-only 模块如 sqlite store）。
 */

import type { AssistantPublicItem } from "@/lib/assistants/types";

export type SessionListItem = {
  id: string;
  title: string | null;
  updatedAt: number;
  assistantId: string | null;
  assistantName: string | null;
  assistantIcon: string | null;
};

export type SessionMessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
};

export async function apiListSessions(): Promise<SessionListItem[]> {
  const res = await fetch("/api/chat/sessions");
  if (!res.ok) throw new Error("无法加载会话列表");
  const data = (await res.json()) as { sessions: SessionListItem[] };
  return data.sessions;
}

export async function apiCreateSession(assistantId?: string | null): Promise<string> {
  const trimmed =
    typeof assistantId === "string" && assistantId.trim() ? assistantId.trim() : null;
  const res = await fetch("/api/chat/sessions", {
    method: "POST",
    headers: trimmed ? { "Content-Type": "application/json" } : undefined,
    body: trimmed ? JSON.stringify({ assistantId: trimmed }) : undefined,
  });
  if (!res.ok) throw new Error("创建会话失败");
  const data = (await res.json()) as { id: string };
  return data.id;
}

export async function apiListAssistantsPublic(): Promise<AssistantPublicItem[]> {
  const res = await fetch("/api/assistants", { cache: "no-store" });
  if (!res.ok) throw new Error("无法加载助手列表");
  const data = (await res.json()) as { assistants?: AssistantPublicItem[] };
  const raw = Array.isArray(data.assistants) ? data.assistants : [];
  return raw.map((a) => ({
    ...a,
    openingMessage:
      typeof a.openingMessage === "string" ? a.openingMessage : "",
  }));
}

export async function apiGetMessages(
  sessionId: string
): Promise<SessionMessageRow[]> {
  const res = await fetch(
    `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`
  );
  if (!res.ok) throw new Error("无法加载消息");
  const data = (await res.json()) as { messages: SessionMessageRow[] };
  return data.messages;
}

export async function apiClearMessages(sessionId: string): Promise<void> {
  const res = await fetch(
    `/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("清空失败");
}

export async function apiDeleteSession(sessionId: string): Promise<void> {
  const res = await fetch(
    `/api/chat/sessions/${encodeURIComponent(sessionId)}`,
    { method: "DELETE" }
  );
  if (res.status === 404) throw new Error("会话不存在");
  if (!res.ok) throw new Error("删除会话失败");
}

/** 避免 Strict Mode / 并发下重复创建空库会话 */
let sessionInitGate: Promise<void> = Promise.resolve();

export async function ensureAtLeastOneSession(): Promise<SessionListItem[]> {
  const prev = sessionInitGate;
  let done!: () => void;
  sessionInitGate = new Promise<void>((r) => {
    done = r;
  });
  await prev;
  try {
    let list = await apiListSessions();
    if (list.length > 0) return list;
    await apiCreateSession();
    list = await apiListSessions();
    if (list.length === 0) {
      throw new Error("初始化会话失败");
    }
    return list;
  } finally {
    done();
  }
}
