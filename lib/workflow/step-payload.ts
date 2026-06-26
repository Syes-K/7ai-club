import {
  getWorkflowNodeCatalogEntry,
  type WorkflowNodeCatalogEntry,
} from "@/lib/workflow/node-catalog";
import type {
  WorkflowStepDetailFormat,
  WorkflowStepEvent,
} from "@/lib/workflow/types";

export function splitSummaryAndDetail(raw: string): {
  summary: string;
  detail?: string;
  detailFormat?: WorkflowStepDetailFormat;
} {
  const splitIndex = raw.indexOf("\n\n");
  if (splitIndex === -1) {
    return { summary: raw };
  }

  return {
    summary: raw.slice(0, splitIndex),
    detail: raw.slice(splitIndex + 2),
    detailFormat: "markdown",
  };
}

function resolveCatalog(nodeId: string, label: string): WorkflowNodeCatalogEntry {
  return (
    getWorkflowNodeCatalogEntry(nodeId) ?? {
      order: 999,
      kind: "default",
      label,
    }
  );
}

export function enrichWorkflowStepEvent(
  event: WorkflowStepEvent,
): WorkflowStepEvent {
  const catalog = resolveCatalog(event.nodeId, event.label);

  return {
    ...event,
    label: event.label || catalog.label,
    kind: event.kind ?? catalog.kind,
    order: event.order ?? catalog.order,
    detailFormat:
      event.detail != null
        ? (event.detailFormat ?? "markdown")
        : event.detailFormat,
  };
}

export function buildStepSuccessPayload(
  nodeId: string,
  rawSummary: string | void,
  base: Omit<WorkflowStepEvent, "summary" | "detail" | "detailFormat">,
): WorkflowStepEvent {
  if (!rawSummary) {
    return enrichWorkflowStepEvent(base);
  }

  const parts = splitSummaryAndDetail(rawSummary);
  return enrichWorkflowStepEvent({
    ...base,
    summary: parts.summary,
    detail: parts.detail,
    detailFormat: parts.detailFormat,
  });
}

export function parseStepDetail(step: WorkflowStepEvent): {
  headline: string | null;
  detail: string | null;
  detailFormat: WorkflowStepDetailFormat;
} {
  if (step.detail?.trim()) {
    return {
      headline: step.summary ?? null,
      detail: step.detail,
      detailFormat: step.detailFormat ?? "markdown",
    };
  }

  if (!step.summary) {
    return { headline: null, detail: null, detailFormat: "markdown" };
  }

  const legacy = splitSummaryAndDetail(step.summary);
  if (legacy.detail) {
    return {
      headline: legacy.summary,
      detail: legacy.detail,
      detailFormat: legacy.detailFormat ?? "markdown",
    };
  }

  return {
    headline: step.summary,
    detail: null,
    detailFormat: "markdown",
  };
}
