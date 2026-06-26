import { describe, expect, it } from "vitest";
import { sortSteps } from "@/lib/workflow/sort-steps";

describe("sortSteps", () => {
  it("sorts by order then startedAt", () => {
    const sorted = sortSteps([
      {
        runId: "run-1",
        nodeId: "llm_stream",
        label: "Generate response",
        status: "success",
        order: 50,
        startedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        runId: "run-1",
        nodeId: "resolve_model",
        label: "Resolve model",
        status: "success",
        order: 40,
        startedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    expect(sorted.map((step) => step.nodeId)).toEqual([
      "resolve_model",
      "llm_stream",
    ]);
  });
});
