"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_CHAT_ROUTE } from "@/lib/chat/route-key";
import { ZHIPU_MODEL_GROUPS } from "@/lib/chat/zhipu-models";
import type { ChatProviderId } from "@/lib/chat/types";

type UserMsg = { id: string; role: "user"; content: string };
type AssistantMsg = {
  id: string;
  role: "assistant";
  content: string;
  phase: "streaming" | "done" | "error";
  errorText?: string;
};
type ChatMsg = UserMsg | AssistantMsg;

function toApiMessages(msgs: ChatMsg[]) {
  const result: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of msgs) {
    if (m.role === "user") {
      result.push({ role: "user", content: m.content });
    } else {
      if (m.phase === "done") {
        result.push({ role: "assistant", content: m.content });
      }
      if (m.phase === "streaming" || m.phase === "error") break;
    }
  }
  return result;
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

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [provider, setProvider] = useState<ChatProviderId>(
    DEFAULT_CHAT_ROUTE.provider
  );
  const [zhipuModel, setZhipuModel] = useState(
    DEFAULT_CHAT_ROUTE.model ?? "glm-4-flash"
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const selectId = "model-select";

  const modelSelectValue =
    provider === "deepseek" ? "deepseek" : `zhipu:${zhipuModel}`;

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const runAssistant = useCallback(
    async (msgsSnapshot: ChatMsg[]) => {
      let assistantId: string | undefined;
      for (let i = msgsSnapshot.length - 1; i >= 0; i--) {
        const m = msgsSnapshot[i];
        if (m.role === "assistant") {
          assistantId = m.id;
          break;
        }
      }
      if (!assistantId) return;

      const body = {
        messages: toApiMessages(msgsSnapshot),
        provider,
        ...(provider === "zhipu" ? { model: zhipuModel } : {}),
      };

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
    },
    [provider, zhipuModel]
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;

    const uid = crypto.randomUUID();
    const aid = crypto.randomUUID();
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

    const next = [...messages, userMsg, asst];
    await runAssistant(next);
  }, [input, busy, messages, runAssistant]);

  const retryLast = useCallback(async () => {
    if (busy) return;
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

    const updated = messages.map((m) =>
      m.id === last.id && m.role === "assistant"
        ? { ...m, content: "", phase: "streaming" as const, errorText: undefined }
        : m
    );
    await runAssistant(updated);
  }, [busy, messages, runAssistant]);

  const clear = useCallback(() => {
    if (busy) return;
    setMessages([]);
  }, [busy]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void send();
    }
  };

  const onModelChange = (value: string) => {
    if (value === "deepseek") {
      setProvider("deepseek");
    } else if (value.startsWith("zhipu:")) {
      setProvider("zhipu");
      setZhipuModel(value.slice(6));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <BotIcon className="text-violet-600 dark:text-violet-400" />
          <h1 className="text-lg font-semibold tracking-tight">AI 对话</h1>
        </div>
        <button
          type="button"
          onClick={() => void clear()}
          disabled={busy || messages.length === 0}
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-200 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          清空对话
        </button>
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-900">
              <BotIcon className="mx-auto mb-3 h-10 w-10 text-violet-600 dark:text-violet-400" />
              <p className="text-base font-medium text-zinc-800 dark:text-zinc-100">
                开始对话
              </p>
              <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                选择模型后输入问题；支持多轮追问，回复以流式展示。快捷键：⌘/Ctrl +
                Enter 发送，Enter 换行。
              </p>
            </div>
          </div>
        ) : (
          <ul className="mx-auto flex max-w-3xl flex-col gap-4">
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
                        className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                      >
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
                        <p className="whitespace-pre-wrap">
                          {m.content}
                          {m.phase === "streaming" && (
                            <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-violet-500 align-middle" />
                          )}
                        </p>
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

      <footer className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={selectId} className="text-xs text-zinc-500">
              模型
            </label>
            <select
              id={selectId}
              value={modelSelectValue}
              disabled={busy}
              onChange={(e) => onModelChange(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            >
              <optgroup label="DeepSeek">
                <option value="deepseek">DeepSeek Chat（默认 deepseek-chat）</option>
              </optgroup>
              {ZHIPU_MODEL_GROUPS.map((g) => (
                <optgroup key={g.label} label={`智谱 · ${g.label}`}>
                  {g.models.map((opt) => (
                    <option key={opt.id} value={`zhipu:${opt.id}`}>
                      {opt.label} — {opt.hint}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
              rows={3}
              placeholder="输入问题…（⌘/Ctrl + Enter 发送）"
              className="min-h-[5rem] flex-1 resize-y rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-violet-500 focus:ring-2 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-950"
              aria-label="消息输入"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy || !input.trim()}
              className="self-end rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40"
            >
              发送
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
