import type { UIMessage } from "ai";
import type { WorkflowRunStatus, WorkflowStepEvent } from "@/lib/workflow/types";
import {
  WORKFLOW_FINAL_NODE_ID,
  WORKFLOW_NODE_ORDER,
  mergeWorkflowStep,
} from "@/lib/workflow/types";

export type TurnWorkflowPhase = "idle" | "running" | "settled";

export type TurnWorkflowLiveState = {
  runId: string | null;
  userMessageId: string;
  steps: WorkflowStepEvent[];
  phase: TurnWorkflowPhase;
};

export type CompletedTurnWorkflow = {
  runId: string;
  userMessageId: string;
  steps: WorkflowStepEvent[];
};

export type TurnWorkflowStore = {
  live: TurnWorkflowLiveState | null;
  completed: Record<string, CompletedTurnWorkflow>;
};

export type TurnStepsView = {
  steps: WorkflowStepEvent[];
  phase: TurnWorkflowPhase;
  isLive: boolean;
};

export type WorkflowRestorePayload = {
  run: { id: string; status: WorkflowRunStatus } | null;
  steps: WorkflowStepEvent[];
};

export const EMPTY_TURN_WORKFLOW_STORE: TurnWorkflowStore = {
  live: null,
  completed: {},
};

function hasActiveStep(steps: WorkflowStepEvent[]): boolean {
  return steps.some((step) => step.status === "running");
}

export function isTurnWorkflowSettled(steps: WorkflowStepEvent[]): boolean {
  if (steps.length === 0) {
    return false;
  }

  if (hasActiveStep(steps)) {
    return false;
  }

  const llmStep = steps.find((step) => step.nodeId === WORKFLOW_FINAL_NODE_ID);
  if (llmStep) {
    return llmStep.status === "success" || llmStep.status === "error";
  }

  return steps.some((step) => step.status === "error");
}

export function normalizeTurnSteps(
  steps: WorkflowStepEvent[],
): WorkflowStepEvent[] {
  if (steps.length === 0) {
    return steps;
  }

  const runId = steps[steps.length - 1]?.runId ?? steps[0]?.runId;
  const scoped = runId
    ? steps.filter((step) => step.runId === runId)
    : steps;

  const byNodeId = new Map(scoped.map((step) => [step.nodeId, step]));
  const ordered = WORKFLOW_NODE_ORDER.flatMap((nodeId) => {
    const step = byNodeId.get(nodeId);
    return step ? [step] : [];
  });

  return ordered.map((step, index) => {
    if (step.status !== "running") {
      return step;
    }

    const hasLaterStep = ordered.slice(index + 1).length > 0;
    if (!hasLaterStep) {
      return step;
    }

    return { ...step, status: "success" as const };
  });
}

export function deriveTurnWorkflowPhase(
  steps: WorkflowStepEvent[],
  options?: { isChatBusy?: boolean },
): TurnWorkflowPhase {
  if (steps.length === 0) {
    return options?.isChatBusy ? "running" : "idle";
  }

  if (hasActiveStep(steps)) {
    return "running";
  }

  if (isTurnWorkflowSettled(steps)) {
    return "settled";
  }

  return "running";
}

export function findLastUserMessageId(messages: UIMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user") {
      return message.id;
    }
  }

  return null;
}

export function findUserMessageIdBeforeAssistant(
  messages: UIMessage[],
  assistantMessageId: string,
): string | null {
  let lastUserId: string | null = null;

  for (const message of messages) {
    if (message.role === "user") {
      lastUserId = message.id;
    }

    if (message.id === assistantMessageId) {
      return lastUserId;
    }
  }

  return null;
}

export function beginTurnWorkflow(
  store: TurnWorkflowStore,
  userMessageId: string,
): TurnWorkflowStore {
  return {
    live: {
      runId: null,
      userMessageId,
      steps: [],
      phase: "running",
    },
    completed: store.completed,
  };
}

export function applyLiveStepEvent(
  live: TurnWorkflowLiveState,
  event: WorkflowStepEvent,
): TurnWorkflowLiveState {
  if (live.runId && live.runId !== event.runId) {
    return live;
  }

  const steps = normalizeTurnSteps(mergeWorkflowStep(live.steps, event));

  return {
    ...live,
    runId: live.runId ?? event.runId,
    steps,
    phase: deriveTurnWorkflowPhase(steps),
  };
}

export function applyLiveWorkflowStep(
  store: TurnWorkflowStore,
  event: WorkflowStepEvent,
  fallbackUserMessageId?: string | null,
): TurnWorkflowStore {
  let live = store.live;

  if (!live && fallbackUserMessageId) {
    live = {
      runId: null,
      userMessageId: fallbackUserMessageId,
      steps: [],
      phase: "running",
    };
  }

  if (!live) {
    return store;
  }

  const updatedLive = applyLiveStepEvent(live, event);
  const next = { ...store, live: updatedLive };

  if (updatedLive.phase === "settled") {
    return settleLiveTurn(next);
  }

  return next;
}

export function settleLiveTurn(store: TurnWorkflowStore): TurnWorkflowStore {
  if (!store.live || store.live.phase !== "settled" || !store.live.runId) {
    return store;
  }

  const { userMessageId, runId, steps } = store.live;

  return {
    live: null,
    completed: {
      ...store.completed,
      [userMessageId]: {
        userMessageId,
        runId,
        steps,
      },
    },
  };
}

function isLastTurnComplete(messages: UIMessage[]): boolean {
  const lastUserId = findLastUserMessageId(messages);
  if (!lastUserId) {
    return false;
  }

  const lastMessage = messages.at(-1);
  return lastMessage?.role === "assistant";
}

export function applyRestoredWorkflow(
  store: TurnWorkflowStore,
  payload: WorkflowRestorePayload,
  userMessageId: string,
  messages: UIMessage[],
): TurnWorkflowStore {
  if (!payload.run || payload.steps.length === 0) {
    return store;
  }

  const steps = normalizeTurnSteps(payload.steps);
  const { status, id: runId } = payload.run;

  if (status === "running") {
    if (store.live && store.live.userMessageId !== userMessageId) {
      return store;
    }

    return {
      ...store,
      live: {
        runId,
        userMessageId,
        steps,
        phase: deriveTurnWorkflowPhase(steps),
      },
    };
  }

  if (
    (status === "completed" || status === "error") &&
    isLastTurnComplete(messages)
  ) {
    if (store.completed[userMessageId]) {
      return store;
    }

    return {
      ...store,
      completed: {
        ...store.completed,
        [userMessageId]: {
          userMessageId,
          runId,
          steps,
        },
      },
    };
  }

  return store;
}

export function getTurnStepsView(
  store: TurnWorkflowStore,
  userMessageId: string,
): TurnStepsView | null {
  if (store.live?.userMessageId === userMessageId) {
    return {
      steps: store.live.steps,
      phase: store.live.phase,
      isLive: true,
    };
  }

  const completed = store.completed[userMessageId];
  if (completed) {
    return {
      steps: completed.steps,
      phase: "settled",
      isLive: false,
    };
  }

  return null;
}

export function toAssistantTurnPhase(
  phase: TurnWorkflowPhase,
): "active" | "completed" {
  return phase === "settled" ? "completed" : "active";
}
