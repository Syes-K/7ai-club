import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { LogIn, MessageSquare } from "lucide-react";
import { landingContainerClass } from "@/lib/constants/landing-layout";
import { LANDING_COPY } from "@/lib/constants/landing";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  user: User | null;
  nickname?: string | null;
  className?: string;
  /** Hide Chat link when already on chat routes */
  showChatLink?: boolean;
  /** Show Admin in user menu for allowlisted users */
  showAdminLink?: boolean;
  /** Full-width bar for app shell (chat / console) */
  fullWidth?: boolean;
  /** Avatar-only user menu (landing) */
  compactUserMenu?: boolean;
}

export function SiteHeader({
  user,
  nickname,
  className,
  showChatLink = true,
  showAdminLink = false,
  fullWidth = false,
  compactUserMenu = false,
}: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-[var(--neon-primary)]/20 bg-[var(--bg-base)]/80 backdrop-blur-md",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-4",
          fullWidth ? "w-full px-4 md:px-6" : landingContainerClass,
        )}
      >
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-wider text-[var(--text-primary)] hover:text-[var(--neon-primary)] transition-colors cursor-pointer"
        >
          {LANDING_COPY.brand}
        </Link>

        <nav className="ml-auto flex items-center gap-3 sm:gap-4">
          {showChatLink && (
            <Link
              href="/chat"
              className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--neon-primary)] transition-colors cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 shrink-0" aria-hidden />
              Chat
            </Link>
          )}

          {user ? (
            <UserMenu
              email={user.email ?? "user"}
              nickname={nickname}
              compact={compactUserMenu}
              showAdminLink={showAdminLink}
            />
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--neon-primary)] transition-colors cursor-pointer"
            >
              <LogIn className="h-4 w-4 shrink-0" aria-hidden />
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
