"use client";

import Link from "next/link";
import { LogOut, MessageSquare, Plus } from "lucide-react";
import type { ConversationSummary } from "@/lib/chat/conversations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  conversations: ConversationSummary[];
  activeId: string;
  onNewChat: () => void;
  onLogout: () => void;
  creating: boolean;
  onNavigate: () => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  onNewChat,
  onLogout,
  creating,
  onNavigate,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4338CA]">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-[#F8FAFC]">7ai-club</span>
        </div>
        <Button
          className="mt-4 w-full"
          onClick={onNewChat}
          disabled={creating}
        >
          <Plus className="h-4 w-4" />
          {creating ? "Creating…" : "New chat"}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <p className="px-3 py-4 text-sm text-[#F8FAFC]/40">No conversations yet</p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <Link
                  href={`/chat/${conversation.id}`}
                  onClick={onNavigate}
                  className={cn(
                    "block truncate rounded-lg px-3 py-2 text-sm transition-colors duration-200 cursor-pointer",
                    conversation.id === activeId
                      ? "bg-[#4338CA]/30 text-[#F8FAFC]"
                      : "text-[#F8FAFC]/70 hover:bg-white/5 hover:text-[#F8FAFC]",
                  )}
                >
                  {conversation.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Button variant="ghost" className="w-full justify-start" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
