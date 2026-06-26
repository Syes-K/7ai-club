"use client";

import type { ChatStatus, UIMessage } from "ai";
import { useEffect } from "react";
import { User } from "lucide-react";
import { AssistantTurn } from "@/components/chat/assistant-turn";
import type { AssistantTurnPhase } from "@/components/chat/assistant-turn";
import { AssistantAvatar } from "@/components/chat/assistant-avatar";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { formatChatErrorMessage } from "@/lib/chat/fetch-with-error";
import { useStickToBottom } from "@/lib/chat/use-stick-to-bottom";
import {
  findUserMessageIdBeforeAssistant,
  getTurnStepsView,
  toAssistantTurnPhase,
  type TurnWorkflowStore,
} from "@/lib/chat/turn-workflow";
import {
  findTurnAssistantMessage,
} from "@/lib/chat/turn-assistant";
import { CHAT_AVATAR_CLASS, CHAT_PANEL_X } from "@/lib/constants/chat-layout";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
  assistantIcon?: string | null;
  workflowStore: TurnWorkflowStore;
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function resolveTurnPhaseForView(
  turnPhase: AssistantTurnPhase,
  isStreaming: boolean,
): AssistantTurnPhase {
  if (isStreaming) {
    return "active";
  }

  return turnPhase;
}

function UserMessage({ message }: { message: UIMessage }) {
  const text = getMessageText(message);

  return (
    <div className="flex flex-row-reverse gap-3">
      <div className={cn(CHAT_AVATAR_CLASS, "bg-[var(--neon-primary)]")}>
        <User className="h-4 w-4 text-white" />
      </div>
      <div className="max-w-[80%] rounded-2xl bg-[var(--neon-primary)] px-4 py-3 text-white">
        <MarkdownContent
          content={text}
          className="[&_a]:text-white [&_code]:text-white/90"
        />
      </div>
    </div>
  );
}

function AssistantMessage({
  message,
  isStreaming,
  assistantIcon,
}: {
  message: UIMessage;
  isStreaming: boolean;
  assistantIcon?: string | null;
}) {
  const text = getMessageText(message);
  if (!text.trim() && !isStreaming) {
    return null;
  }

  const useMarkdown = !isStreaming;

  return (
    <div className="flex flex-row gap-3">
      <AssistantAvatar icon={assistantIcon} />
      <div className="max-w-[80%] rounded-2xl border border-[var(--neon-primary)]/20 bg-[var(--bg-elevated)]/80 px-4 py-3 text-[var(--text-primary)]">
        {useMarkdown ? (
          <MarkdownContent content={text} />
        ) : (
          <span className="whitespace-pre-wrap text-sm leading-relaxed">
            {text || "\u00a0"}
          </span>
        )}
      </div>
    </div>
  );
}

export function ChatMessages({
  messages,
  status,
  error,
  assistantIcon,
  workflowStore,
}: ChatMessagesProps) {
  const turnAssistant = findTurnAssistantMessage(messages);
  const streamingAssistantId =
    status === "streaming" && turnAssistant ? turnAssistant.id : null;

  const {
    containerRef,
    contentRef,
    bottomRef,
    handleScroll,
    stickToBottom,
    followContent,
  } = useStickToBottom();

  useEffect(() => {
    stickToBottom("auto");
  }, [stickToBottom]);

  useEffect(() => {
    if (status === "submitted") {
      stickToBottom("smooth");
    }
  }, [status, stickToBottom]);

  useEffect(() => {
    const behavior = status === "streaming" ? "auto" : "smooth";
    followContent(behavior);
  }, [messages, status, workflowStore, error, followContent]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn("flex-1 overflow-y-auto py-6", CHAT_PANEL_X)}
    >
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <AssistantAvatar icon={assistantIcon} variant="hero" className="mb-4" />
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            Start a new chat
          </h2>
          <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">
            Ask 7ai Assistant anything — replies stream in real time
          </p>
        </div>
      ) : (
        <div ref={contentRef} className="w-full">
          <div className="space-y-6">
            {messages.map((message) => {
            if (message.role === "user") {
              return <UserMessage key={message.id} message={message} />;
            }

            if (message.role === "assistant") {
              const userMessageId = findUserMessageIdBeforeAssistant(
                messages,
                message.id,
              );

              const turnView =
                userMessageId != null
                  ? getTurnStepsView(workflowStore, userMessageId)
                  : null;

              if (turnView) {
                const isStreaming = message.id === streamingAssistantId;
                return (
                  <AssistantTurn
                    key={message.id}
                    message={message}
                    steps={turnView.steps}
                    isStreaming={isStreaming}
                    phase={resolveTurnPhaseForView(
                      toAssistantTurnPhase(turnView.phase),
                      isStreaming,
                    )}
                    assistantIcon={assistantIcon}
                  />
                );
              }

              const text = getMessageText(message);
              if (!text.trim()) {
                return null;
              }

              return (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  isStreaming={message.id === streamingAssistantId}
                  assistantIcon={assistantIcon}
                />
              );
            }

            return null;
          })}
          </div>

          {error ? (
            <div
              className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              role="alert"
            >
              {formatChatErrorMessage(error)}
            </div>
          ) : null}
        </div>
      )}

      {messages.length === 0 && error ? (
        <div
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {formatChatErrorMessage(error)}
        </div>
      ) : null}

      <div ref={bottomRef} className="h-px w-full shrink-0" aria-hidden />
    </div>
  );
}
