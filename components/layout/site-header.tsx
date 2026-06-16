import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { landingContainerClass } from "@/lib/constants/landing-layout";
import { LANDING_COPY } from "@/lib/constants/landing";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  user: User | null;
  className?: string;
  /** Hide Chat link when already on chat routes */
  showChatLink?: boolean;
  /** Full-width bar for app shell (chat) */
  fullWidth?: boolean;
  /** Avatar-only user menu (landing) */
  compactUserMenu?: boolean;
}

export function SiteHeader({
  user,
  className,
  showChatLink = true,
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
              className="text-sm text-[var(--text-muted)] hover:text-[var(--neon-primary)] transition-colors cursor-pointer"
            >
              Chat
            </Link>
          )}

          {user ? (
            <UserMenu email={user.email ?? "user"} compact={compactUserMenu} />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg border border-[var(--neon-primary)]/40 px-3 py-1.5 text-sm text-[var(--neon-primary)] hover:bg-[var(--neon-primary)]/10 transition-colors cursor-pointer"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
