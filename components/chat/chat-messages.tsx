"use client";

import type { ChatStatus, UIMessage } from "ai";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
}

function MessageContent({ message }: { message: UIMessage }) {
  const text = message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");

  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-[#4338CA]" : "bg-[#22C55E]/20",
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-[#22C55E]" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-[#4338CA] text-white"
            : "bg-white/5 text-[#F8FAFC]/90 border border-white/10",
        )}
      >
        {text || "\u00a0"}
      </div>
    </div>
  );
}

export function ChatMessages({ messages, status, error }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4338CA]/20">
            <Bot className="h-6 w-6 text-[#4338CA]" />
          </div>
          <h2 className="text-lg font-medium text-[#F8FAFC]">Start a new chat</h2>
          <p className="mt-2 max-w-sm text-sm text-[#F8FAFC]/50">
            Ask 7ai Assistant anything — replies stream in real time
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <MessageContent key={message.id} message={message} />
          ))}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-sm text-[#F8FAFC]/50">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#22C55E]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#22C55E] [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#22C55E] [animation-delay:300ms]" />
              </span>
              Thinking…
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          className="mx-auto mt-4 max-w-3xl rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {error.message || "Failed to send message. Please try again."}
        </div>
      )}
    </div>
  );
}
