import type { WorkflowStepKind } from "@/lib/workflow/types";

export type WorkflowNodeCatalogEntry = {
  order: number;
  kind: WorkflowStepKind;
  label: string;
};

export const WORKFLOW_NODE_CATALOG: Record<string, WorkflowNodeCatalogEntry> = {
  validate_request: {
    order: 10,
    kind: "default",
    label: "Validate request",
  },
  load_context: { order: 20, kind: "default", label: "Load context" },
  load_history_summary: {
    order: 30,
    kind: "default",
    label: "Loading memory summary",
  },
  resolve_model: { order: 40, kind: "default", label: "Resolve model" },
  reasoning: { order: 45, kind: "reasoning", label: "Reasoning" },
  llm_stream: { order: 50, kind: "default", label: "Generate response" },
  evaluate_summarization: {
    order: 60,
    kind: "default",
    label: "Evaluating context size",
  },
  summarize_history: {
    order: 70,
    kind: "stream",
    label: "Summarizing history",
  },
};

export const REASONING_NODE_ID = "reasoning";

export function getWorkflowNodeCatalogEntry(
  nodeId: string,
): WorkflowNodeCatalogEntry | undefined {
  return WORKFLOW_NODE_CATALOG[nodeId];
}
