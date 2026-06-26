import type { UIMessage } from "ai";
import { sortSteps } from "@/lib/workflow/sort-steps";
import type { WorkflowRunStatus, WorkflowStepDeltaEvent, WorkflowStepEvent } from "@/lib/workflow/types";
import {
  POST_LLM_NODE_IDS,
  WORKFLOW_FINAL_NODE_ID,
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

export type WorkflowRunPayload = {
  run: { id: string; status: WorkflowRunStatus; startedAt?: string };
  steps: WorkflowStepEvent[];
};

export type WorkflowRestorePayload = {
  runs: Array<WorkflowRunPayload & { userMessageId: string | null }>;
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
  if (!llmStep) {
    return steps.some((step) => step.status === "error");
  }

  if (llmStep.status === "error") {
    return true;
  }

  if (llmStep.status !== "success") {
    return false;
  }

  for (const nodeId of POST_LLM_NODE_IDS) {
    const step = steps.find((item) => item.nodeId === nodeId);
    if (!step) {
      return false;
    }

    if (
      step.status !== "success" &&
      step.status !== "error" &&
      step.status !== "skipped"
    ) {
      return false;
    }
  }

  return true;
}

function stepTerminalScore(step: WorkflowStepEvent): number {
  if (
    step.status === "success" ||
    step.status === "error" ||
    step.status === "skipped"
  ) {
    return 2;
  }

  if (step.status === "running") {
    return 1;
  }

  return 0;
}

export function mergeWorkflowSteps(
  localSteps: WorkflowStepEvent[],
  remoteSteps: WorkflowStepEvent[],
): WorkflowStepEvent[] {
  const merged = new Map<string, WorkflowStepEvent>();

  for (const step of localSteps) {
    merged.set(step.nodeId, step);
  }

  for (const step of remoteSteps) {
    const existing = merged.get(step.nodeId);
    if (!existing) {
      merged.set(step.nodeId, step);
      continue;
    }

    if (stepTerminalScore(step) >= stepTerminalScore(existing)) {
      merged.set(step.nodeId, { ...existing, ...step });
    }
  }

  return sortSteps([...merged.values()]);
}

export function isMissingSummarizeStep(steps: WorkflowStepEvent[]): boolean {
  const evaluate = steps.find(
    (step) => step.nodeId === "evaluate_summarization",
  );
  const summarize = steps.find((step) => step.nodeId === "summarize_history");

  if (!evaluate || evaluate.status !== "success") {
    return false;
  }

  return summarize == null;
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

  const sorted = sortSteps(scoped);

  return sorted.map((step, index) => {
    if (step.status !== "running") {
      return step;
    }

    const hasLaterTerminal = sorted
      .slice(index + 1)
      .some((laterStep) => stepTerminalScore(laterStep) >= 2);
    if (!hasLaterTerminal) {
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

export function applyLiveStepDelta(
  live: TurnWorkflowLiveState,
  delta: WorkflowStepDeltaEvent,
): TurnWorkflowLiveState {
  if (live.runId && live.runId !== delta.runId) {
    return live;
  }

  const existing = live.steps.find((step) => step.nodeId === delta.nodeId);
  const nextDetail = `${existing?.detail ?? ""}${delta.delta}`;

  const event: WorkflowStepEvent = {
    runId: delta.runId,
    nodeId: delta.nodeId,
    label: existing?.label ?? "Reasoning",
    status: existing?.status ?? "running",
    detail: nextDetail,
    detailFormat: existing?.detailFormat ?? "plain",
    kind: existing?.kind ?? "reasoning",
    order: existing?.order,
    startedAt: existing?.startedAt,
  };

  return applyLiveStepEvent(live, event);
}

export function applyLiveWorkflowStepDelta(
  store: TurnWorkflowStore,
  delta: WorkflowStepDeltaEvent,
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

  const updatedLive = applyLiveStepDelta(live, delta);
  return { ...store, live: updatedLive };
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

function hasAssistantReplyForUserMessage(
  messages: UIMessage[],
  userMessageId: string,
): boolean {
  let awaitingAssistant = false;

  for (const message of messages) {
    if (message.role === "user" && message.id === userMessageId) {
      awaitingAssistant = true;
      continue;
    }

    if (awaitingAssistant && message.role === "assistant") {
      return true;
    }
  }

  return false;
}

export function applyAllRestoredWorkflows(
  store: TurnWorkflowStore,
  payload: WorkflowRestorePayload,
  messages: UIMessage[],
): TurnWorkflowStore {
  if (payload.runs.length === 0) {
    return store;
  }

  return payload.runs.reduce(
    (next, entry) => {
      if (!entry.userMessageId || entry.steps.length === 0) {
        return next;
      }

      return applyRestoredWorkflow(
        next,
        { run: entry.run, steps: entry.steps },
        entry.userMessageId,
        messages,
      );
    },
    store,
  );
}

export function applyRestoredWorkflow(
  store: TurnWorkflowStore,
  payload: WorkflowRunPayload,
  userMessageId: string,
  messages: UIMessage[],
): TurnWorkflowStore {
  if (!payload.run || payload.steps.length === 0) {
    return store;
  }

  const { status, id: runId } = payload.run;

  if (status === "running") {
    if (store.live && store.live.userMessageId !== userMessageId) {
      return store;
    }

    const restoredSteps = normalizeTurnSteps(payload.steps);
    const mergedSteps =
      store.live?.runId === runId && store.live.steps.length > 0
        ? normalizeTurnSteps(
            mergeWorkflowSteps(store.live.steps, restoredSteps),
          )
        : restoredSteps;

    return {
      ...store,
      live: {
        runId,
        userMessageId,
        steps: mergedSteps,
        phase: deriveTurnWorkflowPhase(mergedSteps),
      },
    };
  }

  if (
    (status === "completed" || status === "error") &&
    hasAssistantReplyForUserMessage(messages, userMessageId)
  ) {
    const restoredSteps = normalizeTurnSteps(payload.steps);
    const existingCompleted = store.completed[userMessageId];

    if (existingCompleted?.runId === runId) {
      const mergedSteps = normalizeTurnSteps(
        mergeWorkflowSteps(existingCompleted.steps, restoredSteps),
      );

      return {
        ...store,
        completed: {
          ...store.completed,
          [userMessageId]: {
            ...existingCompleted,
            steps: mergedSteps,
          },
        },
        live:
          store.live?.userMessageId === userMessageId &&
          deriveTurnWorkflowPhase(mergedSteps) === "settled"
            ? null
            : store.live,
      };
    }

    const mergedSteps =
      store.live?.runId === runId && store.live.userMessageId === userMessageId
        ? normalizeTurnSteps(
            mergeWorkflowSteps(store.live.steps, restoredSteps),
          )
        : restoredSteps;

    return {
      ...store,
      completed: {
        ...store.completed,
        [userMessageId]: {
          userMessageId,
          runId,
          steps: mergedSteps,
        },
      },
      live:
        store.live?.userMessageId === userMessageId &&
        deriveTurnWorkflowPhase(mergedSteps) === "settled"
          ? null
          : store.live,
    };
  }

  return store;
}

export function getTurnStepsView(
  store: TurnWorkflowStore,
  userMessageId: string,
): TurnStepsView | null {
  const completed = store.completed[userMessageId];

  if (store.live?.userMessageId === userMessageId) {
    const steps =
      completed && completed.runId === store.live.runId
        ? normalizeTurnSteps(
            mergeWorkflowSteps(completed.steps, store.live.steps),
          )
        : store.live.steps;

    return {
      steps,
      phase: deriveTurnWorkflowPhase(steps),
      isLive: true,
    };
  }

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
