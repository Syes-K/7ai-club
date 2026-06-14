"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

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
    <div className="border-t border-white/10 bg-[#0F0F23]/80 px-4 py-4 backdrop-blur-md md:px-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-3xl items-end gap-3"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message — Enter to send, Shift+Enter for newline"
          disabled={disabled}
          rows={1}
          className="max-h-40 min-h-10 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#F8FAFC] placeholder:text-[#F8FAFC]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA] disabled:opacity-50"
        />
        <Button type="submit" size="icon" disabled={disabled || !input.trim()}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
