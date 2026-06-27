"use client";

import { useEffect, useRef } from "react";
import {
  getReasoningDetail,
  setReasoningDetailExpanded,
  subscribeReasoningDetail,
} from "@/lib/chat/reasoning-detail-buffer";
import { cn } from "@/lib/utils";

interface ReasoningDetailPanelProps {
  runId: string;
  nodeId: string;
  persistedDetail?: string;
  isStreaming: boolean;
}

const panelClassName =
  "mt-2 max-h-48 overflow-auto rounded-md border border-[var(--neon-primary)]/15 bg-[var(--bg-base)]/60 p-2 text-xs leading-relaxed text-[var(--text-muted)]";

function readDetail(
  runId: string,
  nodeId: string,
  persistedDetail?: string,
): string {
  return getReasoningDetail(runId, nodeId) || persistedDetail || "";
}

export function ReasoningDetailPanel({
  runId,
  nodeId,
  persistedDetail,
  isStreaming,
}: ReasoningDetailPanelProps) {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (!isStreaming) {
      return;
    }

    setReasoningDetailExpanded(runId, nodeId, true);

    const syncFromBuffer = () => {
      const node = preRef.current;
      if (!node) {
        return;
      }

      const text = getReasoningDetail(runId, nodeId);
      node.textContent = text.length > 0 ? `${text}\u2588` : "\u2588";
      node.scrollTop = node.scrollHeight;
    };

    syncFromBuffer();
    const unsubscribe = subscribeReasoningDetail(runId, nodeId, syncFromBuffer);

    return () => {
      unsubscribe();
      setReasoningDetailExpanded(runId, nodeId, false);
    };
  }, [runId, nodeId, isStreaming]);

  if (!isStreaming) {
    const detail = readDetail(runId, nodeId, persistedDetail);
    if (!detail.trim()) {
      return null;
    }

    return (
      <pre className={cn(panelClassName, "whitespace-pre-wrap")}>{detail}</pre>
    );
  }

  return (
    <pre
      ref={preRef}
      className={cn(panelClassName, "whitespace-pre-wrap")}
      suppressHydrationWarning
    />
  );
}
