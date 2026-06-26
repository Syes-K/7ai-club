"use client";

import { useEffect, useState } from "react";
import type { UIMessage } from "ai";
import { AssistantAvatar } from "@/components/chat/assistant-avatar";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { WorkflowStepPanel } from "@/components/chat/workflow/workflow-step-panel";
import { REASONING_NODE_ID } from "@/lib/workflow/node-catalog";
import type { WorkflowStepEvent } from "@/lib/workflow/types";
import { cn } from "@/lib/utils";

export type AssistantTurnPhase = "active" | "completed";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function CompactThinking() {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setDots((count) => (count % 3) + 1);
    }, 450);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2.5" role="status" aria-live="polite">
      <span className="inline-flex gap-1" aria-hidden>
        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-success)]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-success)] [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-success)] [animation-delay:300ms]" />
      </span>
      <span className="font-mono text-sm text-[var(--text-muted)]">
        Thinking{".".repeat(dots)}
      </span>
    </div>
  );
}

function resolveStreamingNodeId(
  steps: WorkflowStepEvent[],
  isStreaming: boolean,
): string | null {
  if (!isStreaming) {
    return null;
  }

  const reasoningStep = steps.find((step) => step.nodeId === REASONING_NODE_ID);
  if (reasoningStep?.status === "running") {
    return REASONING_NODE_ID;
  }

  return null;
}

interface AssistantTurnProps {
  message?: UIMessage;
  steps: WorkflowStepEvent[];
  isStreaming: boolean;
  phase: AssistantTurnPhase;
  assistantIcon?: string | null;
  showThinking?: boolean;
}

export function AssistantTurn({
  message,
  steps,
  isStreaming,
  phase,
  assistantIcon,
  showThinking = false,
}: AssistantTurnProps) {
  const text = message ? getMessageText(message) : "";
  const hasText = text.trim().length > 0;
  const hasSteps = steps.length > 0;
  const useMarkdown = !isStreaming;

  const showThinkingRow = showThinking && !hasSteps && !hasText;
  const showBody = hasText;
  const showDivider = hasSteps && showBody;

  if (!hasSteps && !showBody && !showThinkingRow) {
    return null;
  }

  return (
    <div className="flex gap-3 flex-row" role="article" aria-label="Assistant reply">
      <AssistantAvatar icon={assistantIcon} />
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          "border border-[var(--neon-primary)]/20 bg-[var(--bg-elevated)]/80 text-[var(--text-primary)]",
        )}
      >
        {hasSteps ? (
          <WorkflowStepPanel
            steps={steps}
            isSettled={phase === "completed"}
            defaultExpanded={false}
            streamingNodeId={resolveStreamingNodeId(steps, isStreaming)}
          />
        ) : null}

        {showThinkingRow ? <CompactThinking /> : null}

        {showDivider ? (
          <div
            className="my-3 border-t border-[var(--neon-primary)]/10"
            aria-hidden
          />
        ) : null}

        {showBody ? (
          useMarkdown ? (
            <MarkdownContent content={text} />
          ) : (
            <span className="whitespace-pre-wrap text-sm leading-relaxed">
              {text}
            </span>
          )
        ) : null}
      </div>
    </div>
  );
}
