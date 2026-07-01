import type { UIMessage } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ResolvedUserModel } from "@/lib/llm/provider";
import type { DbMessageWithArchive } from "@/lib/data/types";
import type { MemorySummaryRow, SummarizationPlan } from "@/lib/memory/types";
import type { KnowledgeBaseBinding, RagHit } from "@/lib/rag/types";

export type WorkflowStepStatus = "running" | "success" | "error" | "skipped";

export type WorkflowStepDetailFormat = "plain" | "markdown";
export type WorkflowStepKind = "default" | "reasoning" | "stream";

export type WorkflowRunStatus =
  | "running"
  | "completed"
  | "error"
  | "cancelled";

export type WorkflowStepEvent = {
  runId: string;
  nodeId: string;
  label: string;
  status: WorkflowStepStatus;
  summary?: string;
  detail?: string;
  detailFormat?: WorkflowStepDetailFormat;
  kind?: WorkflowStepKind;
  order?: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type WorkflowStepDeltaEvent = {
  runId: string;
  nodeId: string;
  delta: string;
};

export type ConversationRow = {
  id: string;
  user_id: string;
  assistant_id: string;
  title: string;
};

export type AssistantRow = {
  id: string;
  name: string;
  icon: string | null;
  system_prompt: string;
  model: string;
};

export type ProfileRow = {
  preferred_model_config_id: string | null;
  summarization_enabled: boolean;
  summary_trigger_turns: number;
  summary_retain_turns: number;
  summary_trigger_tokens: number;
  summary_retain_tokens: number;
  summary_model_config_id: string | null;
  rag_confidence_threshold: number;
  rag_top_k: number;
  rag_embedding_provider: string;
  rag_embedding_model: string;
};

export type WorkflowContext = {
  runId: string;
  userId: string;
  conversationId: string;
  message: UIMessage;
  userText: string;
  supabase: SupabaseClient;
  conversation?: ConversationRow;
  dbMessages?: DbMessageWithArchive[];
  uiMessages?: UIMessage[];
  llmUiMessages?: UIMessage[];
  assistant?: AssistantRow;
  profile?: ProfileRow | null;
  memorySummary?: MemorySummaryRow | null;
  summarizationPlan?: SummarizationPlan;
  resolved?: ResolvedUserModel;
  knowledgeBases?: KnowledgeBaseBinding[];
  ragOptimizedQuery?: string;
  ragHits?: RagHit[];
  ragContextText?: string;
  ragHitsDetail?: string;
};

export type StepEmitter = (event: WorkflowStepEvent) => Promise<void>;

export type WorkflowNode = {
  id: string;
  label: string;
  run: (ctx: WorkflowContext) => Promise<string | void>;
};

export type WorkflowRunSummary = {
  id: string;
  status: WorkflowRunStatus;
  startedAt: string;
  activeStreamId: string | null;
};

export function mergeWorkflowStep(
  steps: WorkflowStepEvent[],
  event: WorkflowStepEvent,
): WorkflowStepEvent[] {
  const index = steps.findIndex((step) => step.nodeId === event.nodeId);
  if (index === -1) {
    return [...steps, event];
  }

  const next = [...steps];
  next[index] = { ...next[index], ...event };
  return next;
}

export const WORKFLOW_FINAL_NODE_ID = "llm_stream";

export const POST_LLM_NODE_IDS = [
  "evaluate_summarization",
  "summarize_history",
] as const;

export const WORKFLOW_NODE_ORDER = [
  "validate_request",
  "load_context",
  "load_history_summary",
  "resolve_model",
  "rag_query_optimize",
  "rag_retrieve",
  "reasoning",
  WORKFLOW_FINAL_NODE_ID,
  ...POST_LLM_NODE_IDS,
] as const;
