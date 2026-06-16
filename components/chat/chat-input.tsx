"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { CHAT_PANEL_X } from "@/lib/constants/chat-layout";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const canSend = Boolean(input.trim()) && !disabled;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || disabled) return;
    onSend(text);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div
      className={cn(
        "border-t border-[var(--neon-primary)]/15 bg-[var(--bg-base)]/80 py-4 backdrop-blur-md",
        CHAT_PANEL_X,
      )}
    >
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "relative rounded-xl border border-[var(--neon-primary)]/20 bg-[var(--bg-elevated)]/60",
            "focus-within:border-[var(--neon-primary)]/40 focus-within:ring-2 focus-within:ring-[var(--neon-primary)]/25",
          )}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message — Enter to send, Shift+Enter for a new line"
            disabled={disabled}
            rows={2}
            className="block w-full resize-none bg-transparent px-4 pb-12 pt-3 pr-14 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className={cn(
              "absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full",
              "border border-[var(--neon-primary)]/35 bg-gradient-to-br from-[#1a1040] via-[#12183a] to-[#0d2847]",
              "text-white transition-[box-shadow,border-color,filter] duration-200 ease-out",
              "shadow-[0_0_20px_rgba(0,180,255,0.32)]",
              canSend && [
                "cursor-pointer",
                "hover:border-[var(--neon-primary)]/50 hover:brightness-110",
                "hover:shadow-[0_0_28px_rgba(0,180,255,0.48)]",
                "active:brightness-95",
              ],
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-primary)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-elevated)]",
              "disabled:cursor-not-allowed disabled:border-[var(--neon-primary)]/10 disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-muted)] disabled:shadow-none disabled:brightness-100",
            )}
          >
            <Send
              className="h-[17px] w-[17px] -translate-x-[1px] translate-y-px"
              strokeWidth={2.25}
            />
          </button>
        </div>
      </form>
    </div>
  );
}
