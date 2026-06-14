"use client";

import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, Plus, X } from "lucide-react";
import type { ConversationSummary } from "@/lib/chat/conversations";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  conversationId: string;
  initialMessages: UIMessage[];
  conversations: ConversationSummary[];
  modelLabel: string;
}

export function ChatLayout({
  conversationId,
  initialMessages,
  conversations,
  modelLabel,
}: ChatLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ id, messages: allMessages }) => ({
        body: {
          conversationId: id,
          message: allMessages[allMessages.length - 1],
        },
      }),
    }),
  });

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

  async function handleLogout() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-dvh bg-[#0F0F23] text-[#F8FAFC]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/10 bg-[#1E1B4B]/80 backdrop-blur-md transition-transform duration-200 md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <ChatSidebar
          conversations={conversations}
          activeId={conversationId}
          onNewChat={handleNewChat}
          onLogout={handleLogout}
          creating={creating}
          onNavigate={() => setSidebarOpen(false)}
        />
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden cursor-pointer"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-medium text-[#F8FAFC]">
              7ai Assistant
            </h1>
            <p className="truncate text-xs text-[#F8FAFC]/50">{modelLabel}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNewChat}
            disabled={creating}
            className="hidden sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </header>

        <ChatMessages messages={messages} status={status} error={error} />
        <ChatInput
          onSend={(text) => sendMessage({ text })}
          disabled={status !== "ready"}
        />
      </main>
    </div>
  );
}
