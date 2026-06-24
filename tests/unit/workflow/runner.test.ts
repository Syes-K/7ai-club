import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeWorkflowStep } from "@/lib/workflow/types";
import { runWorkflow } from "@/lib/workflow/runner";
import type {
  StepEmitter,
  WorkflowContext,
  WorkflowNode,
  WorkflowStepEvent,
} from "@/lib/workflow/types";

describe("mergeWorkflowStep", () => {
  it("appends a new step when nodeId is unseen", () => {
    const event: WorkflowStepEvent = {
      runId: "run-1",
      nodeId: "validate_request",
      label: "Validate request",
      status: "running",
    };

    const merged = mergeWorkflowStep([], event);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual(event);
  });

  it("updates an existing step by nodeId", () => {
    const initial: WorkflowStepEvent[] = [
      {
        runId: "run-1",
        nodeId: "load_context",
        label: "Load context",
        status: "running",
      },
    ];

    const merged = mergeWorkflowStep(initial, {
      runId: "run-1",
      nodeId: "load_context",
      label: "Load context",
      status: "success",
      summary: "3 messages",
    });

    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe("success");
    expect(merged[0].summary).toBe("3 messages");
  });
});

describe("runWorkflow", () => {
  const mockSupabase = {} as SupabaseClient;

  it("runs nodes in order and emits running then success", async () => {
    const events: WorkflowStepEvent[] = [];

    const emit: StepEmitter = async (event) => {
      events.push(event);
    };

    const nodes: WorkflowNode[] = [
      {
        id: "step_a",
        label: "Step A",
        async run() {
          return "done-a";
        },
      },
      {
        id: "step_b",
        label: "Step B",
        async run() {
          return "done-b";
        },
      },
    ];

    const ctx: WorkflowContext = {
      runId: "run-1",
      userId: "user-1",
      conversationId: "conv-1",
      message: { id: "m1", role: "user", parts: [{ type: "text", text: "hi" }] },
      userText: "hi",
      supabase: mockSupabase,
    };

    await runWorkflow(nodes, ctx, emit);

    expect(events.map((event) => `${event.nodeId}:${event.status}`)).toEqual([
      "step_a:running",
      "step_a:success",
      "step_b:running",
      "step_b:success",
    ]);
    expect(events[1]?.summary).toBe("done-a");
    expect(events[3]?.summary).toBe("done-b");
  });

  it("stops after the first failing node", async () => {
    const events: WorkflowStepEvent[] = [];
    const emit: StepEmitter = async (event) => {
      events.push(event);
    };

    const nodes: WorkflowNode[] = [
      {
        id: "step_a",
        label: "Step A",
        async run() {},
      },
      {
        id: "step_b",
        label: "Step B",
        async run() {
          throw new Error("boom");
        },
      },
      {
        id: "step_c",
        label: "Step C",
        async run() {},
      },
    ];

    const ctx: WorkflowContext = {
      runId: "run-1",
      userId: "user-1",
      conversationId: "conv-1",
      message: { id: "m1", role: "user", parts: [{ type: "text", text: "hi" }] },
      userText: "hi",
      supabase: mockSupabase,
    };

    await expect(runWorkflow(nodes, ctx, emit)).rejects.toThrow("boom");

    expect(events.some((event) => event.nodeId === "step_c")).toBe(false);
    expect(
      events.filter((event) => event.nodeId === "step_b").at(-1)?.status,
    ).toBe("error");
  });
});
