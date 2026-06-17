"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Bot, Cpu, Plug, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/console/profile", label: "Profile", icon: User },
  { href: "/console/models", label: "Models", icon: Cpu },
  { href: "/console/assistants", label: "Assistants", icon: Bot },
  { href: "/console/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/console/mcp", label: "MCP", icon: Plug },
] as const;

interface ConsoleNavProps {
  onNavigate?: () => void;
  className?: string;
}

export function ConsoleNav({ onNavigate, className }: ConsoleNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1 p-3", className)}>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "border border-[var(--neon-primary)]/35 bg-[var(--neon-primary)]/10 font-medium text-[var(--neon-primary)]"
                : "border border-transparent text-[var(--text-muted)] hover:border-[var(--neon-primary)]/15 hover:bg-white/5 hover:text-[var(--text-primary)]",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
