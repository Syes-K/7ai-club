"use client";

import type { User } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { ConsoleNav } from "@/components/console/console-nav";
import { GridBackground } from "@/components/ui/grid-background";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConsoleShellProps {
  user: User;
  nickname?: string | null;
  children: React.ReactNode;
}

export function ConsoleShell({ user, nickname, children }: ConsoleShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-dvh flex-col bg-[var(--bg-base)] text-[var(--text-primary)]">
      <GridBackground />
      <SiteHeader
        user={user}
        nickname={nickname}
        showChatLink
        showConsoleLink={false}
        fullWidth
      />

      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "fixed bottom-0 left-0 top-14 z-40 w-56 transform border-r border-[var(--neon-primary)]/15 bg-[var(--bg-elevated)]/95 backdrop-blur-md transition-transform duration-200 md:relative md:top-auto md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          )}
        >
          <ConsoleNav onNavigate={() => setSidebarOpen(false)} />
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
          <div className="flex items-center gap-2 border-b border-[var(--neon-primary)]/15 px-4 py-3 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="font-mono text-sm text-[var(--text-muted)]">Console</span>
          </div>
          <div className="flex-1 p-6 md:p-8">
            <div className="w-full">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
