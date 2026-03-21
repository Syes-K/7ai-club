/**
 * 浏览器端调用会话 API（勿从此文件导入服务端-only 模块如 sqlite store）。
 */

export type SessionListItem = {
  id: string;
  title: string | null;
  updatedAt: number;
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

export async function apiCreateSession(): Promise<string> {
  const res = await fetch("/api/chat/sessions", { method: "POST" });
  if (!res.ok) throw new Error("创建会话失败");
  const data = (await res.json()) as { id: string };
  return data.id;
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
