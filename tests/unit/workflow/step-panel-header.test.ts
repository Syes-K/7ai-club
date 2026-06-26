import { describe, expect, it } from "vitest";
import { computeStepPanelHeader } from "@/lib/workflow/step-panel-header";
import type { WorkflowStepEvent } from "@/lib/workflow/types";

const baseStep = (
  partial: Partial<WorkflowStepEvent> & Pick<WorkflowStepEvent, "nodeId" | "status">,
): WorkflowStepEvent => ({
  runId: "run-1",
  label: partial.nodeId,
  ...partial,
});

describe("computeStepPanelHeader", () => {
  it("shows the running step label while active", () => {
    const header = computeStepPanelHeader(
      [
        baseStep({
          nodeId: "validate_request",
          label: "Validate request",
          status: "success",
        }),
        baseStep({
          nodeId: "resolve_model",
          label: "Resolve model",
          status: "running",
        }),
      ],
      { isSettled: false },
    );

    expect(header.title).toBe("Workflow · Resolve model…");
    expect(header.variant).toBe("running");
  });

  it("shows completed count when settled", () => {
    const header = computeStepPanelHeader(
      [
        baseStep({ nodeId: "a", status: "success" }),
        baseStep({ nodeId: "b", status: "success" }),
        baseStep({ nodeId: "c", status: "skipped", summary: "Skipped" }),
      ],
      { isSettled: true },
    );

    expect(header.title).toBe("Workflow · 3 steps completed");
    expect(header.variant).toBe("success");
  });

  it("shows failed count when settled with errors", () => {
    const header = computeStepPanelHeader(
      [
        baseStep({ nodeId: "a", status: "success" }),
        baseStep({ nodeId: "b", status: "error" }),
      ],
      { isSettled: true },
    );

    expect(header.title).toBe("Workflow · 1 steps · 1 failed");
    expect(header.variant).toBe("error");
  });
});
