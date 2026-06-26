import { describe, expect, it } from "vitest";
import {
  EMPTY_TURN_WORKFLOW_STORE,
  applyAllRestoredWorkflows,
  applyLiveWorkflowStep,
  applyRestoredWorkflow,
  beginTurnWorkflow,
  deriveTurnWorkflowPhase,
  getTurnStepsView,
  isMissingSummarizeStep,
  isTurnWorkflowSettled,
  mergeWorkflowSteps,
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
    ).toBe("running");
  });

  it("returns settled when post-LLM steps finished", () => {
    expect(
      deriveTurnWorkflowPhase([
        {
          runId: "run-1",
          nodeId: "llm_stream",
          label: "Generate response",
          status: "success",
        },
        {
          runId: "run-1",
          nodeId: "evaluate_summarization",
          label: "Evaluating context size",
          status: "success",
        },
        {
          runId: "run-1",
          nodeId: "summarize_history",
          label: "Summarizing history",
          status: "success",
          summary: "Skipped",
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
  it("ignores completed runs without a matching assistant reply", () => {
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

  it("restores a completed run when the assistant reply exists", () => {
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

  it("merges summarize step into an existing completed run", () => {
    const messages: UIMessage[] = [userMessage, assistantMessage];
    const next = applyRestoredWorkflow(
      {
        live: null,
        completed: {
          "user-1": {
            userMessageId: "user-1",
            runId: "run-1",
            steps: [
              {
                runId: "run-1",
                nodeId: "evaluate_summarization",
                label: "Evaluating context size",
                status: "success",
              },
            ],
          },
        },
      },
      {
        run: { id: "run-1", status: "completed" },
        steps: [
          {
            runId: "run-1",
            nodeId: "summarize_history",
            label: "Summarizing history",
            status: "success",
            summary: "Skipped",
          },
        ],
      },
      "user-1",
      messages,
    );

    expect(next.completed["user-1"]?.steps.map((step) => step.nodeId)).toEqual([
      "evaluate_summarization",
      "summarize_history",
    ]);
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

describe("applyAllRestoredWorkflows", () => {
  it("restores completed runs for every finished turn", () => {
    const userMessage2 = {
      id: "user-2",
      role: "user" as const,
      parts: [{ type: "text" as const, text: "again" }],
    };
    const assistantMessage2 = {
      id: "assistant-2",
      role: "assistant" as const,
      parts: [{ type: "text" as const, text: "sure" }],
    };
    const messages: UIMessage[] = [
      userMessage,
      assistantMessage,
      userMessage2,
      assistantMessage2,
    ];

    const next = applyAllRestoredWorkflows(
      EMPTY_TURN_WORKFLOW_STORE,
      {
        runs: [
          {
            run: { id: "run-1", status: "completed" },
            userMessageId: "user-1",
            steps: [
              {
                runId: "run-1",
                nodeId: "llm_stream",
                label: "Generate response",
                status: "success",
              },
            ],
          },
          {
            run: { id: "run-2", status: "completed" },
            userMessageId: "user-2",
            steps: [
              {
                runId: "run-2",
                nodeId: "llm_stream",
                label: "Generate response",
                status: "success",
              },
            ],
          },
        ],
      },
      messages,
    );

    expect(next.completed["user-1"]?.runId).toBe("run-1");
    expect(next.completed["user-2"]?.runId).toBe("run-2");
  });
});

describe("applyLiveWorkflowStep", () => {
  it("settles into completed map when post-LLM steps finish", () => {
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

    expect(withRun.live?.steps).toHaveLength(1);
    expect(withRun.live?.phase).toBe("running");

    const withEvaluate = applyLiveWorkflowStep(
      withRun,
      {
        runId: "run-1",
        nodeId: "evaluate_summarization",
        label: "Evaluating context size",
        status: "success",
      },
      "user-1",
    );

    const withSummarize = applyLiveWorkflowStep(
      withEvaluate,
      {
        runId: "run-1",
        nodeId: "summarize_history",
        label: "Summarizing history",
        status: "success",
        summary: "Skipped",
      },
      "user-1",
    );

    expect(withSummarize.live).toBeNull();
    expect(withSummarize.completed["user-1"]?.steps).toHaveLength(3);
    expect(toAssistantTurnPhase(getTurnStepsView(withSummarize, "user-1")!.phase)).toBe(
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

describe("isMissingSummarizeStep", () => {
  it("returns true when evaluate finished but summarize is absent", () => {
    expect(
      isMissingSummarizeStep([
        {
          runId: "run-1",
          nodeId: "evaluate_summarization",
          label: "Evaluating context size",
          status: "success",
        },
      ]),
    ).toBe(true);
  });
});

describe("mergeWorkflowSteps", () => {
  it("keeps local pre-LLM steps when restore only has post-LLM steps", () => {
    const merged = normalizeTurnSteps(
      mergeWorkflowSteps(
        [
          {
            runId: "run-1",
            nodeId: "validate_request",
            label: "Validate request",
            status: "success",
          },
          {
            runId: "run-1",
            nodeId: "llm_stream",
            label: "Generate response",
            status: "success",
          },
        ],
        [
          {
            runId: "run-1",
            nodeId: "evaluate_summarization",
            label: "Evaluating context size",
            status: "success",
          },
          {
            runId: "run-1",
            nodeId: "summarize_history",
            label: "Summarizing history",
            status: "running",
          },
        ],
      ),
    );

    expect(merged.map((step) => step.nodeId)).toEqual([
      "validate_request",
      "llm_stream",
      "evaluate_summarization",
      "summarize_history",
    ]);
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

  it("is false after llm_stream success until post-LLM steps finish", () => {
    expect(
      isTurnWorkflowSettled([
        {
          runId: "run-1",
          nodeId: "llm_stream",
          label: "Generate response",
          status: "success",
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
