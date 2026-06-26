import type { DbMessageWithArchive } from "@/lib/data/types";

export type MemorySummaryRow = {
  content: string;
  token_estimate: number;
  updated_at: string;
};

export type SummarizationPrefs = {
  summarization_enabled: boolean;
  summary_trigger_turns: number;
  summary_retain_turns: number;
  summary_trigger_tokens: number;
  summary_retain_tokens: number;
  summary_model_config_id: string | null;
};

export type ContextStats = {
  completeTurns: number;
  estimatedTokens: number;
};

export type CompleteTurn = {
  user: DbMessageWithArchive;
  assistant: DbMessageWithArchive;
};

export type SummarizationPlan = {
  shouldSummarize: boolean;
  stats: ContextStats;
  archiveIds: string[];
};
