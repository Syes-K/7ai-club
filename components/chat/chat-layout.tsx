"use client";

import type { UIMessage } from "ai";
import type { User } from "@supabase/supabase-js";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Eraser, Menu, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import type { ConversationSummary } from "@/lib/chat/conversations";
import { chatFetch } from "@/lib/chat/fetch-with-error";
import { ClearChatDialog } from "@/components/chat/clear-chat-dialog";
import { CHAT_ACTION_RAIL, CHAT_PANEL_X } from "@/lib/constants/chat-layout";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { GridBackground } from "@/components/ui/grid-background";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  conversationId: string;
  initialMessages: UIMessage[];
  conversations: ConversationSummary[];
  modelLabel: string;
  user: User;
}

export function ChatLayout({
  conversationId,
  initialMessages,
  conversations,
  modelLabel,
  user,
}: ChatLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creating, setCreating] = useState(false);
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
      router.refresh();
    }
  }, [status, router]);

  async function handleNewChat() {
    setCreating(true);
    try {
      const res = await fetch("/api/conversations", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create conversation");
      const { id } = await res.json();
      router.push(`/chat/${id}`);
      router.refresh();
    } finally {
      setCreating(false);
      setSidebarOpen(false);
    }
  }

  async function handleDeleteConversation(id: string) {
    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        typeof body.error === "string" ? body.error : "Failed to delete conversation",
      );
    }

    if (id === conversationId) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        router.push(`/chat/${remaining[0].id}`);
      } else {
        const createRes = await fetch("/api/conversations", { method: "POST" });
        if (!createRes.ok) throw new Error("Failed to create conversation");
        const { id: newId } = await createRes.json();
        router.push(`/chat/${newId}`);
      }
    }

    router.refresh();
  }

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
      router.refresh();
    } finally {
      setClearing(false);
    }
  }

  const canClearChat =
    messages.length > 0 && status !== "streaming" && status !== "submitted";

  return (
    <div className="relative flex h-dvh flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <GridBackground />
      <SiteHeader user={user} showChatLink={false} fullWidth compactUserMenu />

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "fixed bottom-0 left-0 top-14 z-40 w-72 transform border-r border-[var(--neon-primary)]/15 bg-[var(--bg-elevated)]/95 backdrop-blur-md transition-transform duration-200 md:relative md:top-auto md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <ChatSidebar
            conversations={conversations}
            activeId={conversationId}
            onNewChat={handleNewChat}
            onDeleteConversation={handleDeleteConversation}
            creating={creating}
            onNavigate={() => setSidebarOpen(false)}
          />
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-x-0 bottom-0 top-14 z-30 bg-black/50 md:hidden cursor-pointer"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex min-w-0 flex-1 flex-col">
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
                onClick={() => setSidebarOpen((open) => !open)}
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="min-w-0 text-left">
                <h1 className="truncate font-mono text-sm font-medium text-[var(--text-primary)]">
                  7ai Assistant
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

          <ChatMessages messages={messages} status={status} error={error} />
          <ChatInput
            onSend={(text) => sendMessage({ text })}
            disabled={status !== "ready"}
          />
        </main>
      </div>

      <ClearChatDialog
        open={clearDialogOpen}
        clearing={clearing}
        onConfirm={handleClearChat}
        onCancel={() => !clearing && setClearDialogOpen(false)}
      />
    </div>
  );
}
