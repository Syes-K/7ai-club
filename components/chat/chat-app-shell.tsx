"use client";

import type { User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import { AssistantPickerDialog } from "@/components/chat/assistant-picker-dialog";
import { ChatConversationPanel } from "@/components/chat/chat-conversation-panel";
import {
  ChatNavigationFeedback,
  type ChatNavPhase,
} from "@/components/chat/chat-navigation-feedback";
import { ChatShellProvider } from "@/components/chat/chat-shell-context";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { SiteHeader } from "@/components/layout/site-header";
import type { ConversationSummary, ConversationSession } from "@/lib/data/types";
import {
  createConversation,
  deleteConversation,
  listConversationSummaries,
  loadConversationSession,
} from "@/lib/services/browser/conversation-session";
import { GridBackground } from "@/components/ui/grid-background";
import { cn } from "@/lib/utils";

const SLOW_MS = 2500;
const TIMEOUT_MS = 12000;

function getConversationIdFromPath(pathname: string): string {
  const match = pathname.match(/^\/chat\/([^/]+)/);
  return match?.[1] ?? "";
}

interface ChatAppShellProps {
  user: User;
  nickname?: string | null;
  preferredModel?: string | null;
  children: React.ReactNode;
}

export function ChatAppShell({
  user,
  nickname,
  preferredModel = null,
  children,
}: ChatAppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pathConversationId = getConversationIdFromPath(pathname);

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [viewId, setViewId] = useState(pathConversationId);
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [navPhase, setNavPhase] = useState<ChatNavPhase>("idle");
  const loadSeqRef = useRef(0);
  /** True after sidebar-driven nav; blocks stale pathname from re-triggering loads. */
  const clientNavRef = useRef(false);

  const isNavigating = pendingId != null;

  const refreshConversations = useCallback(async (): Promise<ConversationSummary[]> => {
    try {
      const list = await listConversationSummaries();
      setConversations(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listConversationSummaries()
      .then((list) => {
        if (!cancelled) setConversations(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pendingId) return;

    const slowTimer = window.setTimeout(() => {
      setNavPhase((phase) => (phase === "loading" ? "slow" : phase));
    }, SLOW_MS);
    const timeoutTimer = window.setTimeout(() => {
      setNavPhase("timeout");
    }, TIMEOUT_MS);

    return () => {
      window.clearTimeout(slowTimer);
      window.clearTimeout(timeoutTimer);
    };
  }, [pendingId]);

  const loadConversation = useCallback(
    async (
      id: string,
      source: "url" | "user" = "user",
      listOverride?: ConversationSummary[],
    ) => {
      if (source === "user") {
        clientNavRef.current = true;
      }

      const seq = ++loadSeqRef.current;
      setPendingId(id);
      setViewId(id);
      setNavPhase("loading");

      const list = listOverride ?? conversations;
      const summary = list.find((conversation) => conversation.id === id) ?? null;

      try {
        // Data: triggers Supabase GET /rest/v1/messages (see loadConversationSession).
        // Assistant header fields come from sidebar list; preferredModel from layout — not re-fetched here.
        const data = await loadConversationSession(id, {
          summary,
          preferredModel,
        });
        if (seq !== loadSeqRef.current) return;

        setSession(data);
        setPendingId(null);
        setNavPhase("idle");

        if (source === "user") {
          // URL sync only: Next.js router.replace fetches localhost RSC flight for /chat/[id].
          // Not a Supabase call; page.tsx is null — content is already in client state above.
          router.replace(`/chat/${id}`, { scroll: false });
        }
      } catch {
        if (seq !== loadSeqRef.current) return;
        setNavPhase("timeout");
      }
    },
    [router, conversations, preferredModel],
  );

  // Load from URL on first visit / external navigation only (not after client sidebar clicks)
  useEffect(() => {
    if (!pathConversationId) {
      clientNavRef.current = false;
      startTransition(() => {
        setViewId("");
        setSession(null);
        setPendingId(null);
        setNavPhase("idle");
      });
      return;
    }

    if (clientNavRef.current) {
      return;
    }

    if (pathConversationId === session?.conversationId) {
      startTransition(() => {
        setViewId(pathConversationId);
      });
      return;
    }

    if (pendingId === pathConversationId) {
      return;
    }

    void Promise.resolve().then(() => {
      void loadConversation(pathConversationId, "url");
    });
  }, [
    pathConversationId,
    session?.conversationId,
    pendingId,
    loadConversation,
  ]);

  // Browser back / forward
  useEffect(() => {
    function onPopState() {
      clientNavRef.current = false;
      const id = getConversationIdFromPath(window.location.pathname);
      if (!id) {
        setSession(null);
        setViewId("");
        return;
      }
      if (id !== session?.conversationId) {
        void loadConversation(id, "url");
      }
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [loadConversation, session?.conversationId]);

  function handleSelectConversation(id: string) {
    if (id === session?.conversationId && !isNavigating) return;
    if (isNavigating) return;
    setSidebarOpen(false);
    void loadConversation(id, "user");
  }

  function handleNewChat() {
    setPickerOpen(true);
  }

  async function createConversationWithAssistant(assistantId: string) {
    setCreating(true);
    try {
      const id = await createConversation(assistantId);
      setPickerOpen(false);
      setSidebarOpen(false);
      const list = await refreshConversations();
      await loadConversation(id, "user", list);
    } catch {
      // Picker stays open
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteConversation(id: string) {
    await deleteConversation(id);

    const list = await refreshConversations();

    if (id === viewId) {
      const remaining = list.filter((conversation) => conversation.id !== id);
      if (remaining.length > 0) {
        await loadConversation(remaining[0].id, "user", list);
      } else {
        clientNavRef.current = false;
        setSession(null);
        setViewId("");
        setPendingId(null);
        setNavPhase("idle");
        router.replace("/chat");
      }
    }
  }

  function handleNavRetry() {
    const target = pendingId ?? viewId;
    if (!target) {
      router.refresh();
      return;
    }
    void loadConversation(target, session?.conversationId === target ? "url" : "user");
  }

  function handleNavCancel() {
    loadSeqRef.current += 1;
    setPendingId(null);
    setNavPhase("idle");
    if (session) {
      setViewId(session.conversationId);
      clientNavRef.current = true;
      router.replace(`/chat/${session.conversationId}`, { scroll: false });
    }
  }

  const showConversation = session != null;

  return (
    <ChatShellProvider
      value={{
        sidebarOpen,
        toggleSidebar: () => setSidebarOpen((open) => !open),
        openNewChatPicker: handleNewChat,
        creating,
      }}
    >
      <div className="relative flex h-dvh flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
        <GridBackground />
        <SiteHeader
          user={user}
          nickname={nickname}
          showChatLink={false}
          fullWidth
        />

        <div className="flex min-h-0 flex-1">
          <aside
            className={cn(
              "fixed bottom-0 left-0 top-14 z-40 w-72 transform border-r border-[var(--neon-primary)]/15 bg-[var(--bg-elevated)]/95 backdrop-blur-md transition-transform duration-200 md:relative md:top-auto md:translate-x-0",
              sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            )}
          >
            <ChatSidebar
              conversations={conversations}
              activeId={viewId}
              pendingId={pendingId}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
              onDeleteConversation={handleDeleteConversation}
              creating={creating}
              navigationDisabled={isNavigating}
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

          <main className="relative flex min-w-0 flex-1 flex-col">
            {showConversation ? (
              <ChatConversationPanel
                key={session.conversationId}
                conversationId={session.conversationId}
                initialMessages={session.messages}
                assistantName={session.assistantName}
                assistantIcon={session.assistantIcon}
                modelLabel={session.modelLabel}
                onConversationUpdated={refreshConversations}
              />
            ) : (
              !pathConversationId && children
            )}
            <ChatNavigationFeedback
              phase={pendingId ? navPhase : "idle"}
              onRetry={handleNavRetry}
              onCancel={handleNavCancel}
            />
          </main>
        </div>

        <AssistantPickerDialog
          open={pickerOpen}
          creating={creating}
          onOpenChange={setPickerOpen}
          onConfirm={createConversationWithAssistant}
        />
      </div>
    </ChatShellProvider>
  );
}
