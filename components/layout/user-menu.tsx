"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, Shield } from "lucide-react";
import {
  getUserDisplayLabel,
  getUserInitials,
  getUserShortLabel,
} from "@/lib/auth/user-display";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  email: string;
  nickname?: string | null;
  className?: string;
  /** Hide short username beside avatar (header stays compact) */
  compact?: boolean;
  showAdminLink?: boolean;
}

export function UserMenu({
  email,
  nickname,
  className,
  compact = false,
  showAdminLink = false,
}: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const initials = getUserInitials(email);
  const shortLabel = getUserShortLabel(email, nickname);
  const fullLabel = getUserDisplayLabel(email, nickname);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setOpen(false);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-1.5 py-1 transition-colors hover:border-[var(--neon-primary)]/25 hover:bg-white/5"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--neon-primary)]/40 bg-[var(--bg-elevated)] font-mono text-xs text-[var(--accent-success)]"
          aria-hidden
        >
          {initials}
        </div>
        <span
          className={cn(
            "hidden max-w-[7rem] truncate text-sm text-[var(--text-muted)] md:inline",
            compact && "!hidden",
          )}
        >
          {shortLabel}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 overflow-hidden rounded-xl border border-[var(--neon-primary)]/25 bg-[var(--bg-elevated)] shadow-[0_0_24px_rgba(0,128,255,0.15)]"
        >
          <div className="border-b border-[var(--neon-primary)]/15 px-3 py-2.5">
            <p
              className="truncate text-sm font-medium text-[var(--text-primary)]"
              title={fullLabel}
            >
              {fullLabel}
            </p>
          </div>
          <Link
            href="/console"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
          >
            <Settings className="h-4 w-4" />
            Console
          </Link>
          {showAdminLink && (
            <Link
              href="/admin/users"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
