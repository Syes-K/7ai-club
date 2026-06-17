"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ChatConversationErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ChatConversationError({
  error,
  reset,
}: ChatConversationErrorProps) {
  useEffect(() => {
    console.error("Chat conversation load error:", error);
  }, [error]);

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="font-mono text-lg font-semibold text-[var(--text-primary)]">
        Could not load this chat
      </h2>
      <p className="max-w-md text-sm text-[var(--text-muted)]">
        {error.message || "Something went wrong. Check your connection and try again."}
      </p>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
