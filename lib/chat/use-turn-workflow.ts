"use client";

import type { ChatStatus, UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  EMPTY_TURN_WORKFLOW_STORE,
  applyAllRestoredWorkflows,
  applyLiveWorkflowStep,
  beginTurnWorkflow,
  findLastUserMessageId,
  settleLiveTurn,
  type TurnWorkflowStore,
  type WorkflowRestorePayload,
} from "@/lib/chat/turn-workflow";
import type { WorkflowStepDeltaEvent, WorkflowStepEvent } from "@/lib/workflow/types";
import { REASONING_NODE_ID } from "@/lib/workflow/node-catalog";
import {
  clearAllReasoningDetailBuffers,
  clearReasoningDetailBuffer,
  flushPendingReasoningDeltas,
  queueReasoningDetailDelta,
} from "@/lib/chat/reasoning-detail-buffer";

/** Fallback polls after stream ends — only while live turn is still unsettled. */
const WORKFLOW_POLL_INTERVAL_MS = 2000;
const WORKFLOW_POLL_MAX_TICKS = 5;

export function useTurnWorkflow(
  conversationId: string,
  options: {
    chatStatus: ChatStatus;
    messages: UIMessage[];
  },
) {
  const [store, setStore] = useState<TurnWorkflowStore>(EMPTY_TURN_WORKFLOW_STORE);
  const storeRef = useRef(store);
  const restoreGenerationRef = useRef(0);
  const begunUserMessageIdRef = useRef<string | null>(null);
  const messagesRef = useRef(options.messages);
  const loadInFlightRef = useRef<Promise<boolean> | null>(null);
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  useEffect(() => {
    messagesRef.current = options.messages;
  }, [options.messages]);

  const stopWorkflowPoll = useCallback(() => {
    if (pollIntervalRef.current != null) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const shouldStopWorkflowPoll = useCallback((): boolean => {
    const live = storeRef.current.live;
    return live == null || live.phase === "settled";
  }, []);

  const loadWorkflowState = useCallback(async (): Promise<boolean> => {
    if (loadInFlightRef.current) {
      return loadInFlightRef.current;
    }

    const generation = restoreGenerationRef.current;
    const messages = messagesRef.current;

    const request = (async () => {
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
      } finally {
        loadInFlightRef.current = null;
      }
    })();

    loadInFlightRef.current = request;
    return request;
  }, [conversationId]);

  const startWorkflowPollIfNeeded = useCallback(() => {
    stopWorkflowPoll();

    if (shouldStopWorkflowPoll()) {
      return;
    }

    let ticks = 0;

    pollIntervalRef.current = window.setInterval(() => {
      if (shouldStopWorkflowPoll()) {
        stopWorkflowPoll();
        return;
      }

      ticks += 1;
      if (ticks >= WORKFLOW_POLL_MAX_TICKS) {
        stopWorkflowPoll();
        return;
      }

      void loadWorkflowState().then(() => {
        if (shouldStopWorkflowPoll()) {
          stopWorkflowPoll();
        }
      });
    }, WORKFLOW_POLL_INTERVAL_MS);
  }, [loadWorkflowState, shouldStopWorkflowPoll, stopWorkflowPoll]);

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

    setStore((prev) => {
      if (prev.live?.phase === "settled") {
        return settleLiveTurn(prev);
      }

      return prev;
    });

    void loadWorkflowState().then(() => {
      if (shouldStopWorkflowPoll()) {
        stopWorkflowPoll();
        return;
      }

      startWorkflowPollIfNeeded();
    });

    return () => {
      stopWorkflowPoll();
    };
  }, [
    options.chatStatus,
    loadWorkflowState,
    shouldStopWorkflowPoll,
    startWorkflowPollIfNeeded,
    stopWorkflowPoll,
  ]);

  useEffect(() => {
    if (shouldStopWorkflowPoll()) {
      stopWorkflowPoll();
    }
  }, [store.live?.phase, shouldStopWorkflowPoll, stopWorkflowPoll]);

  const handleWorkflowData = useCallback(
    (dataPart: { type: string; data: unknown }) => {
      if (dataPart.type === "data-workflow-step-delta") {
        const delta = dataPart.data as WorkflowStepDeltaEvent;
        queueReasoningDetailDelta(delta.runId, delta.nodeId, delta.delta);
        return;
      }

      if (dataPart.type !== "data-workflow-step") {
        return;
      }

      const event = dataPart.data as WorkflowStepEvent;

      if (
        event.nodeId === REASONING_NODE_ID &&
        (event.status === "success" || event.status === "error")
      ) {
        flushPendingReasoningDeltas();
        clearReasoningDetailBuffer(event.runId, event.nodeId);
      }

      setStore((prev) =>
        applyLiveWorkflowStep(
          prev,
          event,
          findLastUserMessageId(messagesRef.current),
        ),
      );
    },
    [],
  );

  const clearAll = useCallback(() => {
    restoreGenerationRef.current += 1;
    begunUserMessageIdRef.current = null;
    stopWorkflowPoll();
    clearAllReasoningDetailBuffers();
    setStore(EMPTY_TURN_WORKFLOW_STORE);
  }, [stopWorkflowPoll]);

  return {
    store,
    handleWorkflowData,
    clearAll,
  };
}
