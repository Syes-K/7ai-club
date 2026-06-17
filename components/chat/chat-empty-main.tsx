"use client";

import { Menu, X } from "lucide-react";
import { useChatShell } from "@/components/chat/chat-shell-context";
import { Button } from "@/components/ui/button";

export function ChatEmptyMain() {
  const { sidebarOpen, toggleSidebar, openNewChatPicker, creating } =
    useChatShell();

  return (
    <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center px-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-3 md:hidden"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <div className="max-w-md text-center">
        <h1 className="font-mono text-xl font-semibold">No chats yet</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Start a new conversation and pick an assistant to guide the chat.
        </p>
        <Button className="mt-6" onClick={openNewChatPicker} disabled={creating}>
          New chat
        </Button>
      </div>
    </div>
  );
}
