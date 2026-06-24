"use client";

import type { ChatStatus, UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  EMPTY_TURN_WORKFLOW_STORE,
  applyLiveWorkflowStep,
  applyRestoredWorkflow,
  beginTurnWorkflow,
  findLastUserMessageId,
  settleLiveTurn,
  type TurnWorkflowStore,
  type WorkflowRestorePayload,
} from "@/lib/chat/turn-workflow";
import type { WorkflowStepEvent } from "@/lib/workflow/types";

export function useTurnWorkflow(
  conversationId: string,
  options: {
    chatStatus: ChatStatus;
    messages: UIMessage[];
  },
) {
  const [store, setStore] = useState<TurnWorkflowStore>(EMPTY_TURN_WORKFLOW_STORE);
  const restoreGenerationRef = useRef(0);
  const begunUserMessageIdRef = useRef<string | null>(null);

  const loadWorkflowState = useCallback(
    async (messages: UIMessage[]) => {
      const generation = restoreGenerationRef.current;

      try {
        const response = await fetch(`/api/chat/${conversationId}/workflow`);
        if (!response.ok || generation !== restoreGenerationRef.current) {
          return;
        }

        const payload = (await response.json()) as WorkflowRestorePayload;
        if (generation !== restoreGenerationRef.current) {
          return;
        }

        const userMessageId = findLastUserMessageId(messages);
        if (!userMessageId || !payload.run) {
          return;
        }

        setStore((prev) =>
          applyRestoredWorkflow(prev, payload, userMessageId, messages),
        );
      } catch {
        // Ignore workflow restore errors; chat history still loads from DB.
      }
    },
    [conversationId],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await loadWorkflowState(options.messages);
      if (cancelled) {
        return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [conversationId, loadWorkflowState, options.messages]);

  const prevChatStatusRef = useRef(options.chatStatus);

  useEffect(() => {
    if (options.chatStatus !== "submitted") {
      return;
    }

    const userMessageId = findLastUserMessageId(options.messages);
    if (!userMessageId || userMessageId === begunUserMessageIdRef.current) {
      return;
    }

    begunUserMessageIdRef.current = userMessageId;
    restoreGenerationRef.current += 1;
    setStore((prev) => beginTurnWorkflow(prev, userMessageId));
  }, [options.chatStatus, options.messages]);

  useEffect(() => {
    const prevStatus = prevChatStatusRef.current;
    prevChatStatusRef.current = options.chatStatus;

    if (prevStatus === "ready" || options.chatStatus !== "ready") {
      return;
    }

    void loadWorkflowState(options.messages);

    setStore((prev) => {
      if (prev.live?.phase === "settled") {
        return settleLiveTurn(prev);
      }

      return prev;
    });
  }, [options.chatStatus, options.messages, loadWorkflowState]);

  const handleWorkflowData = useCallback(
    (dataPart: { type: string; data: unknown }) => {
      if (dataPart.type !== "data-workflow-step") {
        return;
      }

      setStore((prev) =>
        applyLiveWorkflowStep(
          prev,
          dataPart.data as WorkflowStepEvent,
          findLastUserMessageId(options.messages),
        ),
      );
    },
    [options.messages],
  );

  const clearAll = useCallback(() => {
    restoreGenerationRef.current += 1;
    begunUserMessageIdRef.current = null;
    setStore(EMPTY_TURN_WORKFLOW_STORE);
  }, []);

  return {
    store,
    handleWorkflowData,
    clearAll,
  };
}
