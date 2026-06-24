"use client";

import { Loader2 } from "lucide-react";
import { AssistantAvatar } from "@/components/chat/assistant-avatar";
import { DeleteConversationDialog } from "@/components/chat/delete-conversation-dialog";
import type { ConversationSummary } from "@/lib/chat/conversations";
import { formatConversationTimestamp } from "@/lib/chat/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface ChatSidebarProps {
  conversations: ConversationSummary[];
  activeId: string;
  pendingId?: string | null;
  listLoading?: boolean;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => Promise<void>;
  creating: boolean;
  navigationDisabled?: boolean;
  onNavigate: () => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  pendingId = null,
  listLoading = false,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  creating,
  navigationDisabled = false,
  onNavigate,
}: ChatSidebarProps) {
  const [pendingDelete, setPendingDelete] = useState<ConversationSummary | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await onDeleteConversation(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--neon-primary)]/15 p-4">
          <Button
            variant="secondary"
            className="w-full font-mono tracking-wide shadow-[0_0_16px_rgba(0,128,255,0.1)] hover:shadow-[0_0_20px_rgba(0,128,255,0.2)]"
            onClick={onNewChat}
            disabled={creating || navigationDisabled}
          >
            <Plus className="h-4 w-4" />
            {creating ? "Creating…" : "New chat"}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {listLoading ? (
            <p className="flex items-center gap-2 px-3 py-4 text-sm text-[var(--text-muted)]">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--neon-primary)]" />
              Loading conversations…
            </p>
          ) : conversations.length === 0 ? (
            <p className="px-3 py-4 text-sm text-[var(--text-muted)]">
              No conversations yet
            </p>
          ) : (
            <ul className="space-y-1.5">
              {conversations.map((conversation) => {
                const isActive = conversation.id === activeId;
                const isPending = pendingId === conversation.id;

                return (
                  <li key={conversation.id}>
                    <div
                      className={cn(
                        "group relative flex items-start gap-1 rounded-lg transition-colors",
                        isActive
                          ? "bg-[var(--neon-primary)]/15"
                          : isPending
                            ? "bg-[var(--neon-primary)]/10"
                            : "hover:bg-white/5",
                      )}
                    >
                      {(isActive || isPending) && (
                        <span
                          className={cn(
                            "absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-[var(--neon-primary)]",
                            isPending && "animate-pulse",
                          )}
                          aria-hidden
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectConversation(conversation.id);
                          onNavigate();
                        }}
                        disabled={navigationDisabled && !isPending}
                        className={cn(
                          "min-w-0 flex-1 rounded-lg py-2.5 pl-3 pr-1 text-left transition-colors duration-200 cursor-pointer disabled:cursor-wait",
                          isActive ? "pl-3.5" : "pl-3",
                        )}
                      >
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            isActive || isPending
                              ? "text-[var(--text-primary)]"
                              : "text-[var(--text-primary)]/90",
                          )}
                        >
                          {conversation.title}
                        </p>
                        <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs text-[var(--text-muted)]">
                          {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--neon-primary)]" />
                          ) : (
                            <AssistantAvatar
                              icon={conversation.assistant_icon}
                              variant="inline"
                            />
                          )}
                          <span className="truncate">
                            {isPending ? "Loading…" : conversation.assistant_name}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]/70">
                          {formatConversationTimestamp(conversation.updated_at)}
                        </p>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${conversation.title}`}
                        disabled={navigationDisabled}
                        className="mt-2 shrink-0 rounded-md p-1.5 text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 cursor-pointer disabled:opacity-30"
                        onClick={() => setPendingDelete(conversation)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </div>

      <DeleteConversationDialog
        open={pendingDelete != null}
        title={pendingDelete?.title ?? ""}
        deleting={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </>
  );
}
