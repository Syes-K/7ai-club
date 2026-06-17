import { Bot } from "lucide-react";
import { CHAT_AVATAR_CLASS } from "@/lib/constants/chat-layout";
import { cn } from "@/lib/utils";

interface AssistantAvatarProps {
  icon?: string | null;
  /** inline: sidebar label; avatar: message bubble; hero: empty state */
  variant?: "inline" | "avatar" | "hero";
  className?: string;
}

const AVATAR_BOX_CLASS =
  "border border-[var(--neon-primary)]/25 bg-[var(--bg-elevated)]/90";

export function AssistantAvatar({
  icon,
  variant = "avatar",
  className,
}: AssistantAvatarProps) {
  const trimmed = icon?.trim();

  if (variant === "inline") {
    if (trimmed) {
      return (
        <span
          className={cn("shrink-0 text-sm leading-none", className)}
          aria-hidden
        >
          {trimmed}
        </span>
      );
    }
    return (
      <Bot
        className={cn(
          "h-3.5 w-3.5 shrink-0 text-[var(--neon-primary)]",
          className,
        )}
        aria-hidden
      />
    );
  }

  if (variant === "hero") {
    return (
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl",
          AVATAR_BOX_CLASS,
          className,
        )}
      >
        {trimmed ? (
          <span className="text-2xl leading-none" aria-hidden>
            {trimmed}
          </span>
        ) : (
          <Bot className="h-6 w-6 text-[var(--neon-primary)]" aria-hidden />
        )}
      </div>
    );
  }

  return (
    <div className={cn(CHAT_AVATAR_CLASS, AVATAR_BOX_CLASS, className)}>
      {trimmed ? (
        <span className="text-lg leading-none" aria-hidden>
          {trimmed}
        </span>
      ) : (
        <Bot className="h-4 w-4 text-[var(--neon-primary)]" aria-hidden />
      )}
    </div>
  );
}
