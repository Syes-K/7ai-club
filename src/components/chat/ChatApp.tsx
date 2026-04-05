"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_CHAT_ROUTE } from "@/lib/chat/route-key";
import { ModelSelect } from "./ModelSelect";
import type { ChatProviderId } from "@/lib/provider/types";
import {
  apiClearMessages,
  apiCreateSession,
  apiDeleteSession,
  apiGetMessages,
  apiListAssistantsPublic,
  apiListSessions,
  ensureAtLeastOneSession,
  type SessionListItem,
  type SessionMessageRow,
} from "@/lib/chat/session-api-client";
import { NewSessionAssistantModal } from "./NewSessionAssistantModal";
import { DEEPSEEK_DEFAULT_MODEL } from "@/lib/provider/constants";
import { FALLBACK_DEFAULTS } from "@/lib/config/defaults";
import { fetchPublicAppConfig } from "@/lib/config/public-config-client";
import { normalizeChatRouteModel } from "@/lib/provider/route";
import { randomUUID } from "@/lib/random-uuid";
import { SessionDockedSidebar, SessionDrawer } from "./SessionSidebar";
import { ChatMarkdown } from "./ChatMarkdown";

type UserMsg = { id: string; role: "user"; content: string };
type AssistantMsg = {
  id: string;
  role: "assistant";
  content: string;
  phase: "streaming" | "done" | "error";
  errorText?: string;
};
type ChatMsg = UserMsg | AssistantMsg;

function mapStoredRowsToChat(rows: SessionMessageRow[]): ChatMsg[] {
  const out: ChatMsg[] = [];
  for (const r of rows) {
    if (r.role === "user") {
      out.push({ id: r.id, role: "user", content: r.content });
    } else if (r.role === "assistant") {
      out.push({
        id: r.id,
        role: "assistant",
        content: r.content,
        phase: "done",
      });
    }
  }
  return out;
}

async function consumeSse(
  response: Response,
  onDelta: (t: string) => void
): Promise<{ error?: string }> {
  if (!response.ok) {
    try {
      const j = (await response.json()) as { error?: string };
      return { error: j.error ?? `HTTP ${response.status}` };
    } catch {
      return { error: `HTTP ${response.status}` };
    }
  }

  const reader = response.body?.getReader();
  if (!reader) return { error: "无响应体" };

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      for (const line of block.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        try {
          const j = JSON.parse(payload) as {
            type?: string;
            text?: string;
            message?: string;
          };
          if (j.type === "delta" && typeof j.text === "string") {
            onDelta(j.text);
          }
          if (j.type === "error") {
            return { error: j.message ?? "流式错误" };
          }
          if (j.type === "done") {
            return {};
          }
        } catch {
          /* 忽略单行解析失败 */
        }
      }
    }
  }

  return {};
}

function BotIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <rect x="4" y="8" width="16" height="10" rx="2" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  );
}

function assistantSessionBadge(s: SessionListItem | null) {
  if (!s) return null;
  if (s.assistantId) {
    const emoji = s.assistantIcon?.trim() || "🤖";
    const name = s.assistantName?.trim() || "助手";
    return (
      <span
        className="inline-flex max-w-[9rem] items-center gap-1 truncate rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 sm:max-w-[12rem] sm:px-2 sm:text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        aria-label={`当前助手：${name}`}
      >
        <span className="shrink-0 text-sm leading-none sm:text-base" aria-hidden>
          {emoji}
        </span>
        <span className="truncate">{name}</span>
      </span>
    );
  }
  if (s.assistantName || s.assistantIcon) {
    return (
      <span className="rounded-md border border-red-300 px-1.5 py-0.5 text-xs text-zinc-500 sm:px-2 sm:text-sm dark:border-red-800 dark:text-zinc-400">
        助手已删除
      </span>
    );
  }
  return null;
}

/** 助手配置的单条开场白（非模型生成，仅展示） */
function AssistantOpeningBlock({ text }: { text: string }) {
  const t = text.trim();
  if (!t) return null;
  return (
    <li className="flex justify-start gap-2">
      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
        <BotIcon className="h-4 w-4" />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-violet-200/80 bg-white px-4 py-2.5 shadow-sm dark:border-violet-800/50 dark:bg-zinc-900">
        <p className="text-[11px] font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
          开场白
        </p>
        <div className="mt-1.5 text-zinc-800 dark:text-zinc-100">
          <ChatMarkdown>{t}</ChatMarkdown>
        </div>
      </div>
    </li>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function ChatApp() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newSessionModalOpen, setNewSessionModalOpen] = useState(false);
  const [assistantOpeningMessage, setAssistantOpeningMessage] = useState("");
  const [provider, setProvider] = useState<ChatProviderId>(
    DEFAULT_CHAT_ROUTE.provider
  );
  const [currentModelId, setCurrentModelId] = useState(
    DEFAULT_CHAT_ROUTE.model ?? "glm-4-flash"
  );
  const [appDisplayName, setAppDisplayName] = useState(
    FALLBACK_DEFAULTS.appDisplayName
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(
    null
  );
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectId = "model-select";
  const loadTokenRef = useRef(0);

  const showAssistantOpening = useMemo(() => {
    const aid = sessions.find((x) => x.id === activeSessionId)?.assistantId;
    return Boolean(aid && assistantOpeningMessage.trim());
  }, [activeSessionId, assistantOpeningMessage, sessions]);

  const openingScrollKey = assistantOpeningMessage;

  const modelSelectValue =
    provider === "deepseek" ? DEEPSEEK_DEFAULT_MODEL : currentModelId;

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, openingScrollKey, scrollToBottom]);

  useEffect(() => {
    const s = sessions.find((x) => x.id === activeSessionId);
    if (!s?.assistantId) {
      setAssistantOpeningMessage("");
      return;
    }
    let cancelled = false;
    void apiListAssistantsPublic()
      .then((list) => {
        if (cancelled) return;
        const a = list.find((x) => x.id === s.assistantId);
        setAssistantOpeningMessage(a?.openingMessage?.trim() ?? "");
      })
      .catch(() => {
        if (!cancelled) setAssistantOpeningMessage("");
      });
    return () => {
      cancelled = true;
    };
  }, [activeSessionId, sessions]);

  useEffect(() => {
    void (async () => {
      const pub = await fetchPublicAppConfig();
      if (!pub) return;
      setProvider(pub.defaultProvider);
      setCurrentModelId(pub.defaultModel);
      setAppDisplayName(pub.appDisplayName);
      if (typeof document !== "undefined") {
        document.title = pub.appDisplayName;
      }
    })();
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      const list = await apiListSessions();
      setSessions(list);
    } catch {
      /* 标题刷新失败可忽略 */
    }
  }, []);

  const loadMessagesForSession = useCallback(
    async (sessionId: string) => {
      const token = ++loadTokenRef.current;
      setMessages([]);
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const rows = await apiGetMessages(sessionId);
        if (loadTokenRef.current !== token) return;
        setMessages(mapStoredRowsToChat(rows));
      } catch (e) {
        if (loadTokenRef.current !== token) return;
        setMessagesError(
          e instanceof Error ? e.message : "加载消息失败"
        );
        setMessages([]);
      } finally {
        if (loadTokenRef.current === token) {
          setMessagesLoading(false);
        }
      }
    },
    []
  );

  const selectSession = useCallback(
    async (id: string) => {
      if (busy) return;
      if (id === activeSessionId && !messagesError) return;
      setActiveSessionId(id);
      await loadMessagesForSession(id);
    },
    [activeSessionId, busy, loadMessagesForSession, messagesError]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setSessionsLoading(true);
        setSessionsError(null);
        const list = await ensureAtLeastOneSession();
        if (cancelled) return;
        setSessions(list);
        const firstId = list[0].id;
        setActiveSessionId(firstId);
        await loadMessagesForSession(firstId);
      } catch (e) {
        if (!cancelled) {
          setSessionsError(
            e instanceof Error ? e.message : "初始化失败"
          );
        }
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMessagesForSession]);

  const openNewSessionModal = useCallback(() => {
    if (busy) return;
    setNewSessionModalOpen(true);
  }, [busy]);

  const handleNewSessionCreated = useCallback(
    async (id: string) => {
      await refreshSessions();
      setDrawerOpen(false);
      await selectSession(id);
      queueMicrotask(() => textareaRef.current?.focus());
    },
    [refreshSessions, selectSession]
  );

  const retryBootstrap = useCallback(() => {
    setSessionsError(null);
    setSessionsLoading(true);
    void (async () => {
      try {
        const list = await ensureAtLeastOneSession();
        setSessions(list);
        const firstId = list[0].id;
        setActiveSessionId(firstId);
        await loadMessagesForSession(firstId);
      } catch (e) {
        setSessionsError(
          e instanceof Error ? e.message : "初始化失败"
        );
      } finally {
        setSessionsLoading(false);
      }
    })();
  }, [loadMessagesForSession]);

  const postSessionSse = useCallback(
    async (
      assistantId: string,
      body: Record<string, unknown>
    ) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const { error } = await consumeSse(res, (text) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId && m.role === "assistant"
              ? { ...m, content: m.content + text }
              : m
          )
        );
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && m.role === "assistant"
            ? error
              ? {
                  ...m,
                  phase: "error",
                  errorText: error,
                }
              : { ...m, phase: "done" }
            : m
        )
      );
      setBusy(false);
      if (!error) void refreshSessions();
    },
    [refreshSessions]
  );

  const send = useCallback(async () => {
    const text = input.trim();
    const sid = activeSessionId;
    if (!text || busy || !sid) return;

    const aid = randomUUID();
    const uid = randomUUID();
    const userMsg: UserMsg = { id: uid, role: "user", content: text };
    const asst: AssistantMsg = {
      id: aid,
      role: "assistant",
      content: "",
      phase: "streaming",
    };

    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, userMsg, asst]);

    const normalizedModel = normalizeChatRouteModel(provider, currentModelId);
    const body: Record<string, unknown> = {
      sessionId: sid,
      content: text,
      provider,
      ...(normalizedModel ? { model: normalizedModel } : {}),
    };
    await postSessionSse(aid, body);
  }, [
    input,
    busy,
    activeSessionId,
    provider,
    currentModelId,
    postSessionSse,
  ]);

  const retryLast = useCallback(async () => {
    if (busy || !activeSessionId) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || last.phase !== "error") return;

    setBusy(true);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === last.id && m.role === "assistant"
          ? { ...m, content: "", phase: "streaming", errorText: undefined }
          : m
      )
    );

    const normalizedModel = normalizeChatRouteModel(provider, currentModelId);
    const body: Record<string, unknown> = {
      sessionId: activeSessionId,
      retryLast: true,
      provider,
      ...(normalizedModel ? { model: normalizedModel } : {}),
    };
    await postSessionSse(last.id, body);
  }, [
    busy,
    activeSessionId,
    messages,
    provider,
    currentModelId,
    postSessionSse,
  ]);

  const clear = useCallback(async () => {
    if (busy || !activeSessionId) return;
    try {
      await apiClearMessages(activeSessionId);
      setMessages([]);
      void refreshSessions();
    } catch (e) {
      setMessagesError(
        e instanceof Error ? e.message : "清空失败"
      );
    }
  }, [busy, activeSessionId, refreshSessions]);

  const deleteSessionById = useCallback(
    async (id: string) => {
      if (busy || deletingSessionId) return;
      if (
        !confirm("确定删除此会话？删除后无法恢复。")
      ) {
        return;
      }
      setDeletingSessionId(id);
      try {
        await apiDeleteSession(id);
        const list = await apiListSessions();
        setSessions(list);
        const wasActive = id === activeSessionId;
        if (wasActive) {
          if (list.length > 0) {
            const nextId = list[0].id;
            setActiveSessionId(nextId);
            await loadMessagesForSession(nextId);
          } else {
            const nid = await apiCreateSession();
            const list2 = await apiListSessions();
            setSessions(list2);
            setActiveSessionId(nid);
            await loadMessagesForSession(nid);
          }
          setMessagesError(null);
        }
      } catch (e) {
        setSessionsError(
          e instanceof Error ? e.message : "删除会话失败"
        );
      } finally {
        setDeletingSessionId(null);
      }
    },
    [
      activeSessionId,
      busy,
      deletingSessionId,
      loadMessagesForSession,
    ]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    if (e.nativeEvent.isComposing) return;
    if (e.shiftKey) return;
    e.preventDefault();
    void send();
  };

  const onModelChange = (value: string) => {
    if (value === DEEPSEEK_DEFAULT_MODEL) {
      setProvider("deepseek");
    } else {
      setProvider("zhipu");
      setCurrentModelId(value);
    }
  };

  const sidebarProps = {
    sessions,
    activeId: activeSessionId,
    busy,
    deletingSessionId,
    loading: sessionsLoading,
    error: sessionsError,
    onSelect: (id: string) => {
      void selectSession(id);
    },
    onNew: () => {
      openNewSessionModal();
    },
    onDeleteSession: (id: string) => {
      void deleteSessionById(id);
    },
    onRetryLoad: sessionsError ? retryBootstrap : undefined,
  };

  const ready = activeSessionId !== null && !sessionsLoading && !sessionsError;
  const currentSession =
    sessions.find((x) => x.id === activeSessionId) ?? null;

  return (
    <div className="flex h-full min-h-0 flex-1 bg-zinc-50 dark:bg-zinc-950">
      <NewSessionAssistantModal
        open={newSessionModalOpen}
        onClose={() => setNewSessionModalOpen(false)}
        onCreated={handleNewSessionCreated}
      />
      <SessionDockedSidebar {...sidebarProps} />
      <SessionDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        {...sidebarProps}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-800 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className="-ml-0.5 inline-flex rounded-lg p-2 text-zinc-600 outline-none ring-violet-500 hover:bg-zinc-200 focus-visible:ring-2 sm:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
              aria-expanded={drawerOpen}
              aria-label="打开会话列表"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </button>
            <BotIcon className="hidden shrink-0 text-violet-600 sm:block dark:text-violet-400" />
            <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight sm:flex-none sm:text-lg">
              {appDisplayName}
            </h1>
            <div className="min-w-0 shrink-0">{assistantSessionBadge(currentSession)}</div>
          </div>
          <button
            type="button"
            onClick={() => void clear()}
            disabled={busy || messages.length === 0 || !ready}
            title="清空对话"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-zinc-600 outline-none ring-violet-500 hover:bg-zinc-200 focus-visible:ring-2 disabled:opacity-40 sm:px-3 sm:py-1.5 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <TrashIcon className="shrink-0" />
            <span className="hidden sm:inline">清空对话</span>
          </button>
        </header>

        <div
          ref={listRef}
          className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4"
          role="log"
          aria-live="polite"
        >
          {messagesLoading && (
            <div className="flex justify-center py-16 text-sm text-zinc-500 dark:text-zinc-400">
              加载消息…
            </div>
          )}
          {messagesError && !messagesLoading && (
            <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {messagesError}
            </div>
          )}
          {!messagesLoading &&
            !messagesError &&
            messages.length === 0 &&
            !showAssistantOpening && (
            <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
                <BotIcon className="mx-auto mb-3 h-10 w-10 text-violet-600 dark:text-violet-400" />
                <p className="text-base font-medium text-zinc-800 dark:text-zinc-100">
                  开始对话
                </p>
                <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                  在输入框下方选择模型后发送消息；支持多轮追问与历史会话切换。快捷键：Enter
                  发送，Shift+Enter 换行。
                </p>
              </div>
            </div>
          )}
          {!messagesLoading &&
            !messagesError &&
            (messages.length > 0 || showAssistantOpening) && (
            <ul className="mx-auto flex max-w-3xl flex-col gap-3 sm:gap-4">
              {showAssistantOpening && (
                <AssistantOpeningBlock text={assistantOpeningMessage} />
              )}
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={
                    m.role === "user"
                      ? "flex justify-end gap-2"
                      : "flex justify-start gap-2"
                  }
                >
                  {m.role === "assistant" && (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      <BotIcon className="h-4 w-4" />
                    </span>
                  )}
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-md bg-violet-600 px-4 py-2.5 text-white"
                        : "max-w-[85%] rounded-2xl rounded-bl-md border border-zinc-200 bg-white px-4 py-2.5 text-zinc-800 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    }
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {m.content}
                      </p>
                    ) : m.phase === "error" ? (
                      <div className="space-y-2 text-sm">
                        <p className="flex items-start gap-2 text-red-600 dark:text-red-400">
                          <span aria-hidden>⚠</span>
                          <span>{m.errorText ?? "请求失败"}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => void retryLast()}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 outline-none ring-violet-500 hover:bg-zinc-200 focus-visible:ring-2 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <RefreshIcon className="shrink-0" />
                          重试
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed">
                        {m.phase === "streaming" && m.content.length === 0 && (
                          <p className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-violet-500" />
                            AI 正在思考…
                          </p>
                        )}
                        {(m.content.length > 0 || m.phase === "done") && (
                          <div className="min-w-0">
                            <ChatMarkdown>{m.content}</ChatMarkdown>
                            {m.phase === "streaming" && (
                              <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-violet-500 align-middle" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && (
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                      <UserIcon className="h-4 w-4" />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="shrink-0 border-t border-zinc-200 bg-white px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] dark:border-zinc-800 dark:bg-zinc-900 sm:px-4 sm:py-3">
          <div className="relative mx-auto max-w-3xl">
            <label htmlFor={selectId} className="sr-only">
              模型
            </label>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy || !ready}
              rows={3}
              placeholder="输入问题…（Enter 发送，Shift+Enter 换行）"
              className="min-h-[4.5rem] w-full resize-y rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 pb-14 pr-3 text-sm outline-none ring-violet-500 focus:ring-2 disabled:opacity-60 sm:min-h-[5rem] sm:pb-16 dark:border-zinc-600 dark:bg-zinc-950"
              aria-label="消息输入"
            />
            {/* 左右拉满：模型在文本框左下角，发送在右下，同一行对齐 */}
            <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between gap-3 sm:bottom-3 sm:left-3 sm:right-3">
              <div className="min-w-0 w-[min(18rem,calc(100%-5rem))] max-w-[calc(100%-5rem)] shrink sm:min-w-[12rem]">
                <ModelSelect
                  id={selectId}
                  dropdownPlacement="above"
                  className="relative w-full min-w-0"
                  value={modelSelectValue}
                  disabled={busy}
                  onChange={onModelChange}
                />
              </div>
              <button
                type="button"
                onClick={() => void send()}
                disabled={busy || !input.trim() || !ready}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-violet-600 px-2.5 py-1.5 text-sm font-medium text-white shadow-sm outline-none ring-offset-2 ring-offset-white hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-40 sm:rounded-xl sm:px-3 sm:py-2 dark:ring-offset-zinc-900"
              >
                <SendIcon className="shrink-0 text-white" />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
