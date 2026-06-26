"use client";

import type { ChatStatus, UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  EMPTY_TURN_WORKFLOW_STORE,
  applyAllRestoredWorkflows,
  applyLiveWorkflowStep,
  applyLiveWorkflowStepDelta,
  beginTurnWorkflow,
  findLastUserMessageId,
  settleLiveTurn,
  type TurnWorkflowStore,
  type WorkflowRestorePayload,
} from "@/lib/chat/turn-workflow";
import type { WorkflowStepDeltaEvent, WorkflowStepEvent } from "@/lib/workflow/types";

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
  const messagesRef = useRef(options.messages);

  useEffect(() => {
    messagesRef.current = options.messages;
  }, [options.messages]);

  const loadWorkflowState = useCallback(async () => {
    const generation = restoreGenerationRef.current;
    const messages = messagesRef.current;

    try {
      const response = await fetch(`/api/chat/${conversationId}/workflow`);
      if (!response.ok || generation !== restoreGenerationRef.current) {
        return false;
      }

      const payload = (await response.json()) as WorkflowRestorePayload;
      if (generation !== restoreGenerationRef.current) {
        return false;
      }

      if (payload.runs.length === 0 || messages.length === 0) {
        return false;
      }

      setStore((prev) => applyAllRestoredWorkflows(prev, payload, messages));

      return true;
    } catch {
      return false;
    }
  }, [conversationId]);

  const userMessageCount = options.messages.filter(
    (message) => message.role === "user",
  ).length;

  useEffect(() => {
    if (userMessageCount === 0) {
      return;
    }

    void loadWorkflowState();
  }, [conversationId, userMessageCount, loadWorkflowState]);

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

    void loadWorkflowState();

    setStore((prev) => {
      if (prev.live?.phase === "settled") {
        return settleLiveTurn(prev);
      }

      return prev;
    });

    let cancelled = false;
    let ticks = 0;
    const intervalId = window.setInterval(() => {
      if (cancelled || ticks >= 20) {
        window.clearInterval(intervalId);
        return;
      }

      ticks += 1;
      void loadWorkflowState();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [options.chatStatus, loadWorkflowState]);

  const handleWorkflowData = useCallback(
    (dataPart: { type: string; data: unknown }) => {
      if (dataPart.type === "data-workflow-step-delta") {
        setStore((prev) =>
          applyLiveWorkflowStepDelta(
            prev,
            dataPart.data as WorkflowStepDeltaEvent,
            findLastUserMessageId(messagesRef.current),
          ),
        );
        return;
      }

      if (dataPart.type !== "data-workflow-step") {
        return;
      }

      setStore((prev) =>
        applyLiveWorkflowStep(
          prev,
          dataPart.data as WorkflowStepEvent,
          findLastUserMessageId(messagesRef.current),
        ),
      );
    },
    [],
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
