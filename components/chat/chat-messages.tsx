"use client";

import { useEffect, useState } from "react";
import type { ChatStatus, UIMessage } from "ai";
import { Bot, User } from "lucide-react";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { formatChatErrorMessage } from "@/lib/chat/fetch-with-error";
import { CHAT_AVATAR_CLASS, CHAT_PANEL_X } from "@/lib/constants/chat-layout";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function MessageContent({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming: boolean;
}) {
  const text = getMessageText(message);
  const isUser = message.role === "user";
  const useMarkdown = isUser || !isStreaming;

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div className={cn(CHAT_AVATAR_CLASS, isUser ? "bg-[var(--neon-primary)]" : "bg-[var(--accent-success)]/20")}>
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-[var(--accent-success)]" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-[var(--neon-primary)] text-white"
            : "border border-[var(--neon-primary)]/20 bg-[var(--bg-elevated)]/80 text-[var(--text-primary)]",
        )}
      >
        {useMarkdown ? (
          <MarkdownContent
            content={text}
            className={isUser ? "[&_a]:text-white [&_code]:text-white/90" : undefined}
          />
        ) : (
          <span className="whitespace-pre-wrap text-sm leading-relaxed">
            {text || "\u00a0"}
          </span>
        )}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setDots((count) => (count % 3) + 1);
    }, 450);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex gap-3" role="status" aria-live="polite">
      <div className={cn(CHAT_AVATAR_CLASS, "bg-[var(--accent-success)]/20")}>
        <Bot className="h-4 w-4 text-[var(--accent-success)]" />
      </div>
      <div className="rounded-2xl border border-[var(--neon-primary)]/20 bg-[var(--bg-elevated)]/80 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex gap-1" aria-hidden>
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-success)]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-success)] [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-success)] [animation-delay:300ms]" />
          </span>
          <span className="inline-block min-w-[6.5rem] font-mono text-sm text-[var(--text-muted)]">
            Thinking{".".repeat(dots)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ChatMessages({ messages, status, error }: ChatMessagesProps) {
  const lastMessage = messages.at(-1);
  const streamingAssistantId =
    status === "streaming" && lastMessage?.role === "assistant"
      ? lastMessage.id
      : null;

  return (
    <div className={cn("flex-1 overflow-y-auto py-6", CHAT_PANEL_X)}>
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--neon-primary)]/20">
            <Bot className="h-6 w-6 text-[var(--neon-primary)]" />
          </div>
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            Start a new chat
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">
            Ask 7ai Assistant anything — replies stream in real time
          </p>
        </div>
      ) : (
        <div className="w-full space-y-6">
          {messages.map((message) => (
            <MessageContent
              key={message.id}
              message={message}
              isStreaming={message.id === streamingAssistantId}
            />
          ))}
          {status === "submitted" && <ThinkingIndicator />}
        </div>
      )}

      {error && (
        <div
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {formatChatErrorMessage(error)}
        </div>
      )}
    </div>
  );
}
