import type { WorkflowStepEvent } from "@/lib/workflow/types";

export type StepPanelHeaderVariant = "running" | "success" | "error";

export type StepPanelHeader = {
  title: string;
  variant: StepPanelHeaderVariant;
};

function countTerminalErrors(steps: WorkflowStepEvent[]): number {
  return steps.filter((step) => step.status === "error").length;
}

function findRunningStep(
  steps: WorkflowStepEvent[],
): WorkflowStepEvent | undefined {
  return steps.find((step) => step.status === "running");
}

function findLastSuccessStep(
  steps: WorkflowStepEvent[],
): WorkflowStepEvent | undefined {
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    const step = steps[index];
    if (step?.status === "success") {
      return step;
    }
  }

  return undefined;
}

export function computeStepPanelHeader(
  steps: WorkflowStepEvent[],
  options: { isSettled: boolean },
): StepPanelHeader {
  const running = findRunningStep(steps);
  if (running) {
    return {
      title: `Workflow · ${running.label}…`,
      variant: "running",
    };
  }

  const errorCount = countTerminalErrors(steps);
  const successCount = steps.filter(
    (step) => step.status === "success" || step.status === "skipped",
  ).length;

  if (options.isSettled) {
    if (errorCount > 0) {
      return {
        title: `Workflow · ${successCount} steps · ${errorCount} failed`,
        variant: "error",
      };
    }

    return {
      title: `Workflow · ${steps.length} steps completed`,
      variant: "success",
    };
  }

  const lastSuccess = findLastSuccessStep(steps);
  if (lastSuccess) {
    return {
      title: `Workflow · ${lastSuccess.label}…`,
      variant: "running",
    };
  }

  return {
    title: "Workflow…",
    variant: "running",
  };
}
