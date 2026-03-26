import { MODEL_IDS } from "@/lib/provider/models";
import type { AppConfig } from "./defaults";
import { FALLBACK_DEFAULTS } from "./defaults";

/** 将磁盘上的部分 JSON 与默认值合并（容错，不抛） */
export function mergeAppConfigPartial(partial: unknown): AppConfig {
  const d = FALLBACK_DEFAULTS;
  if (!partial || typeof partial !== "object") {
    return { ...d };
  }
  const o = partial as Record<string, unknown>;

  let max = d.maxMessagesInContext;
  if (
    typeof o.maxMessagesInContext === "number" &&
    Number.isInteger(o.maxMessagesInContext) &&
    o.maxMessagesInContext >= 1 &&
    o.maxMessagesInContext <= 200
  ) {
    max = o.maxMessagesInContext;
  }

  let defaultProvider = d.defaultProvider;
  if (typeof o.defaultProvider === "string" && o.defaultProvider.trim()) {
    defaultProvider = o.defaultProvider.trim();
  }

  let defaultModel = d.defaultModel;
  if (
    typeof o.defaultModel === "string" &&
    MODEL_IDS.includes(o.defaultModel.trim())
  ) {
    defaultModel = o.defaultModel.trim();
  }

  const chatLoggingEnabled =
    typeof o.chatLoggingEnabled === "boolean"
      ? o.chatLoggingEnabled
      : d.chatLoggingEnabled;

  let appDisplayName = d.appDisplayName;
  if (typeof o.appDisplayName === "string" && o.appDisplayName.trim()) {
    appDisplayName = o.appDisplayName.trim().slice(0, 40);
  }

  const contextSummaryEnabled =
    typeof o.contextSummaryEnabled === "boolean"
      ? o.contextSummaryEnabled
      : d.contextSummaryEnabled;

  let contextSummaryMaxChars = d.contextSummaryMaxChars;
  if (
    typeof o.contextSummaryMaxChars === "number" &&
    Number.isInteger(o.contextSummaryMaxChars) &&
    o.contextSummaryMaxChars >= 200 &&
    o.contextSummaryMaxChars <= 8000
  ) {
    contextSummaryMaxChars = o.contextSummaryMaxChars;
  }

  let contextSummaryRefreshEvery = d.contextSummaryRefreshEvery;
  if (
    typeof o.contextSummaryRefreshEvery === "number" &&
    Number.isInteger(o.contextSummaryRefreshEvery) &&
    o.contextSummaryRefreshEvery >= 1 &&
    o.contextSummaryRefreshEvery <= 200
  ) {
    contextSummaryRefreshEvery = o.contextSummaryRefreshEvery;
  }

  let embeddingApiBaseUrl = d.embeddingApiBaseUrl;
  if (o.embeddingApiBaseUrl === null) {
    embeddingApiBaseUrl = null;
  } else if (typeof o.embeddingApiBaseUrl === "string") {
    const t = o.embeddingApiBaseUrl.trim();
    embeddingApiBaseUrl = t ? t.slice(0, 512) : null;
  }

  let embeddingModel = d.embeddingModel;
  if (o.embeddingModel === null) {
    embeddingModel = null;
  } else if (typeof o.embeddingModel === "string") {
    const t = o.embeddingModel.trim();
    embeddingModel = t ? t.slice(0, 200) : null;
  }

  let knowledgeChunkSize = d.knowledgeChunkSize;
  if (
    typeof o.knowledgeChunkSize === "number" &&
    Number.isInteger(o.knowledgeChunkSize) &&
    o.knowledgeChunkSize >= 64 &&
    o.knowledgeChunkSize <= 4096
  ) {
    knowledgeChunkSize = o.knowledgeChunkSize;
  }

  let knowledgeChunkOverlap = d.knowledgeChunkOverlap;
  if (
    typeof o.knowledgeChunkOverlap === "number" &&
    Number.isInteger(o.knowledgeChunkOverlap) &&
    o.knowledgeChunkOverlap >= 0 &&
    o.knowledgeChunkOverlap < knowledgeChunkSize
  ) {
    knowledgeChunkOverlap = o.knowledgeChunkOverlap;
  }

  let intentConfidenceThreshold = d.intentConfidenceThreshold;
  if (
    typeof o.intentConfidenceThreshold === "number" &&
    Number.isFinite(o.intentConfidenceThreshold) &&
    o.intentConfidenceThreshold >= 0 &&
    o.intentConfidenceThreshold <= 1
  ) {
    intentConfidenceThreshold = o.intentConfidenceThreshold;
  }

  let intentSearchTopN = d.intentSearchTopN;
  if (
    typeof o.intentSearchTopN === "number" &&
    Number.isInteger(o.intentSearchTopN) &&
    o.intentSearchTopN >= 1 &&
    o.intentSearchTopN <= 20
  ) {
    intentSearchTopN = o.intentSearchTopN;
  }

  let intentScoreThreshold = d.intentScoreThreshold;
  if (
    typeof o.intentScoreThreshold === "number" &&
    Number.isFinite(o.intentScoreThreshold) &&
    o.intentScoreThreshold >= -1 &&
    o.intentScoreThreshold <= 1
  ) {
    intentScoreThreshold = o.intentScoreThreshold;
  }

  return {
    maxMessagesInContext: max,
    defaultProvider,
    defaultModel,
    chatLoggingEnabled,
    appDisplayName,
    contextSummaryEnabled,
    contextSummaryMaxChars,
    contextSummaryRefreshEvery,
    embeddingApiBaseUrl,
    embeddingModel,
    knowledgeChunkSize,
    knowledgeChunkOverlap,
    intentConfidenceThreshold,
    intentSearchTopN,
    intentScoreThreshold,
  };
}
