"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ChatNavPhase = "idle" | "loading" | "slow" | "timeout";

interface ChatNavigationFeedbackProps {
  phase: ChatNavPhase;
  onRetry: () => void;
  onCancel: () => void;
}

export function ChatNavigationFeedback({
  phase,
  onRetry,
  onCancel,
}: ChatNavigationFeedbackProps) {
  if (phase === "idle") return null;

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[var(--bg-base)]/85 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy={phase !== "timeout"}
    >
      {phase !== "timeout" ? (
        <Loader2 className="h-8 w-8 animate-spin text-[var(--neon-primary)]" />
      ) : null}

      <p className="text-center font-mono text-sm text-[var(--text-primary)]">
        {phase === "loading" && "Loading conversation…"}
        {phase === "slow" && "Still loading…"}
        {phase === "timeout" && "Having trouble loading this chat"}
      </p>

      {phase === "slow" && (
        <p className="max-w-sm text-center text-xs text-[var(--text-muted)]">
          Your connection may be slow. Please wait a moment.
        </p>
      )}

      {phase === "timeout" && (
        <>
          <p className="max-w-sm text-center text-xs text-[var(--text-muted)]">
            Check your network and try again.
          </p>
          <div className="flex gap-3">
            <Button onClick={onRetry}>Retry</Button>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
