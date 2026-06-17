"use client";

import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Eraser, Menu, X } from "lucide-react";
import { useChatShell } from "@/components/chat/chat-shell-context";
import { chatFetch } from "@/lib/chat/fetch-with-error";
import { ClearChatDialog } from "@/components/chat/clear-chat-dialog";
import { CHAT_ACTION_RAIL, CHAT_PANEL_X } from "@/lib/constants/chat-layout";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatConversationPanelProps {
  conversationId: string;
  initialMessages: UIMessage[];
  assistantName: string;
  assistantIcon?: string | null;
  modelLabel: string;
  onConversationUpdated?: () => void;
}

export function ChatConversationPanel({
  conversationId,
  initialMessages,
  assistantName,
  assistantIcon,
  modelLabel,
  onConversationUpdated,
}: ChatConversationPanelProps) {
  const { sidebarOpen, toggleSidebar } = useChatShell();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: chatFetch,
      prepareSendMessagesRequest: ({ id, messages: allMessages }) => ({
        body: {
          conversationId: id,
          message: allMessages[allMessages.length - 1],
        },
      }),
    }),
  });

  const prevStatusRef = useRef(status);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    if (
      (prevStatus === "streaming" || prevStatus === "submitted") &&
      status === "ready"
    ) {
      onConversationUpdated?.();
    }
  }, [status, onConversationUpdated]);

  async function handleClearChat() {
    setClearing(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          typeof body.error === "string" ? body.error : "Failed to clear chat",
        );
      }
      setMessages([]);
      setClearDialogOpen(false);
      onConversationUpdated?.();
    } finally {
      setClearing(false);
    }
  }

  const canClearChat =
    messages.length > 0 && status !== "streaming" && status !== "submitted";

  return (
    <>
      <header
        className={cn(
          "flex items-center gap-3 border-b border-[var(--neon-primary)]/15 py-3",
          CHAT_PANEL_X,
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="min-w-0 text-left">
            <h1 className="truncate font-mono text-sm font-medium text-[var(--text-primary)]">
              {assistantIcon ? (
                <span className="mr-1.5" aria-hidden>
                  {assistantIcon}
                </span>
              ) : null}
              {assistantName}
            </h1>
            <p className="truncate text-xs text-[var(--text-muted)]">{modelLabel}</p>
          </div>
        </div>
        <div className={CHAT_ACTION_RAIL}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setClearDialogOpen(true)}
            disabled={!canClearChat}
            title="Clear chat"
            aria-label="Clear chat"
            className="border border-[var(--neon-primary)]/15 text-[var(--text-muted)]"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ChatMessages
        messages={messages}
        status={status}
        error={error}
        assistantIcon={assistantIcon}
      />
      <ChatInput
        onSend={(text) => sendMessage({ text })}
        disabled={status !== "ready"}
      />

      <ClearChatDialog
        open={clearDialogOpen}
        clearing={clearing}
        onConfirm={handleClearChat}
        onCancel={() => !clearing && setClearDialogOpen(false)}
      />
    </>
  );
}
