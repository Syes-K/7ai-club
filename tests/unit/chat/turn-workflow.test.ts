import { describe, expect, it } from "vitest";
import {
  EMPTY_TURN_WORKFLOW_STORE,
  applyLiveWorkflowStep,
  applyRestoredWorkflow,
  beginTurnWorkflow,
  deriveTurnWorkflowPhase,
  getTurnStepsView,
  isTurnWorkflowSettled,
  normalizeTurnSteps,
  settleLiveTurn,
  toAssistantTurnPhase,
} from "@/lib/chat/turn-workflow";
import type { UIMessage } from "ai";

const userMessage = {
  id: "user-1",
  role: "user" as const,
  parts: [{ type: "text" as const, text: "hello" }],
};

const assistantMessage = {
  id: "assistant-1",
  role: "assistant" as const,
  parts: [{ type: "text" as const, text: "hi" }],
};

describe("deriveTurnWorkflowPhase", () => {
  it("returns running for an in-progress step", () => {
    expect(
      deriveTurnWorkflowPhase([
        {
          runId: "run-1",
          nodeId: "load_context",
          label: "Load context",
          status: "running",
        },
      ]),
    ).toBe("running");
  });

  it("returns settled when llm_stream succeeded", () => {
    expect(
      deriveTurnWorkflowPhase([
        {
          runId: "run-1",
          nodeId: "llm_stream",
          label: "Generate response",
          status: "success",
        },
      ]),
    ).toBe("settled");
  });
});

describe("beginTurnWorkflow", () => {
  it("starts a fresh live turn without carrying previous live steps", () => {
    const store = beginTurnWorkflow(
      {
        live: {
          runId: "old-run",
          userMessageId: "old-user",
          steps: [
            {
              runId: "old-run",
              nodeId: "llm_stream",
              label: "Generate response",
              status: "success",
            },
          ],
          phase: "settled",
        },
        completed: {},
      },
      "user-2",
    );

    expect(store.live?.userMessageId).toBe("user-2");
    expect(store.live?.steps).toEqual([]);
    expect(store.live?.phase).toBe("running");
  });
});

describe("applyRestoredWorkflow", () => {
  it("ignores completed runs when the last turn is not complete", () => {
    const next = applyRestoredWorkflow(
      EMPTY_TURN_WORKFLOW_STORE,
      {
        run: { id: "run-old", status: "completed" },
        steps: [
          {
            runId: "run-old",
            nodeId: "llm_stream",
            label: "Generate response",
            status: "success",
          },
        ],
      },
      "user-1",
      [userMessage],
    );

    expect(next.completed["user-1"]).toBeUndefined();
    expect(next.live).toBeNull();
  });

  it("restores a completed run for the latest finished turn", () => {
    const messages: UIMessage[] = [userMessage, assistantMessage];
    const next = applyRestoredWorkflow(
      EMPTY_TURN_WORKFLOW_STORE,
      {
        run: { id: "run-1", status: "completed" },
        steps: [
          {
            runId: "run-1",
            nodeId: "llm_stream",
            label: "Generate response",
            status: "success",
          },
        ],
      },
      "user-1",
      messages,
    );

    expect(next.completed["user-1"]?.runId).toBe("run-1");
    expect(getTurnStepsView(next, "user-1")?.phase).toBe("settled");
  });

  it("restores only running runs into live state", () => {
    const next = applyRestoredWorkflow(
      EMPTY_TURN_WORKFLOW_STORE,
      {
        run: { id: "run-1", status: "running" },
        steps: [
          {
            runId: "run-1",
            nodeId: "validate_request",
            label: "Validate request",
            status: "success",
          },
        ],
      },
      "user-1",
      [userMessage],
    );

    expect(next.live?.runId).toBe("run-1");
    expect(next.live?.phase).toBe("running");
  });
});

describe("applyLiveWorkflowStep", () => {
  it("settles into completed map when llm_stream finishes", () => {
    const store = beginTurnWorkflow(EMPTY_TURN_WORKFLOW_STORE, "user-1");
    const withRun = applyLiveWorkflowStep(
      { ...store, live: { ...store.live!, runId: "run-1" } },
      {
        runId: "run-1",
        nodeId: "llm_stream",
        label: "Generate response",
        status: "success",
      },
      "user-1",
    );

    expect(withRun.live).toBeNull();
    expect(withRun.completed["user-1"]?.steps[0]?.status).toBe("success");
    expect(toAssistantTurnPhase(getTurnStepsView(withRun, "user-1")!.phase)).toBe(
      "completed",
    );
  });
});

describe("normalizeTurnSteps", () => {
  it("promotes stale running steps when later steps already exist", () => {
    const normalized = normalizeTurnSteps([
      {
        runId: "run-1",
        nodeId: "load_context",
        label: "Load context",
        status: "running",
      },
      {
        runId: "run-1",
        nodeId: "llm_stream",
        label: "Generate response",
        status: "success",
      },
    ]);

    expect(normalized[0]?.status).toBe("success");
  });
});

describe("isTurnWorkflowSettled", () => {
  it("is false while generate response is running", () => {
    expect(
      isTurnWorkflowSettled([
        {
          runId: "run-1",
          nodeId: "llm_stream",
          label: "Generate response",
          status: "running",
        },
      ]),
    ).toBe(false);
  });
});

describe("settleLiveTurn", () => {
  it("moves settled live state into completed map", () => {
    const settled = settleLiveTurn({
      live: {
        runId: "run-1",
        userMessageId: "user-1",
        steps: [
          {
            runId: "run-1",
            nodeId: "llm_stream",
            label: "Generate response",
            status: "success",
          },
        ],
        phase: "settled",
      },
      completed: {},
    });

    expect(settled.live).toBeNull();
    expect(settled.completed["user-1"]).toBeDefined();
  });
});
