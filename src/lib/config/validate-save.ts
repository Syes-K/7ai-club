import { ZHIPU_MODEL_IDS } from "@/lib/chat/zhipu-models";
import type { ChatProviderId } from "@/lib/chat/types";
import type { AppConfig } from "./defaults";
import { FALLBACK_DEFAULTS } from "./defaults";

export function validateAppConfigForSave(
  body: unknown
): { ok: true; config: AppConfig } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "请求体须为 JSON 对象" };
  }
  const o = body as Record<string, unknown>;

  const max = o.maxMessagesInContext;
  if (
    typeof max !== "number" ||
    !Number.isInteger(max) ||
    max < 1 ||
    max > 200
  ) {
    return {
      ok: false,
      error: "maxMessagesInContext 须为 1～200 的整数",
    };
  }

  const p = o.defaultProvider;
  if (p !== "zhipu" && p !== "deepseek") {
    return { ok: false, error: "defaultProvider 须为 zhipu 或 deepseek" };
  }
  const defaultProvider = p as ChatProviderId;

  const dm = o.defaultModel;
  if (typeof dm !== "string" || !dm.trim()) {
    return { ok: false, error: "defaultModel 须为非空字符串" };
  }
  const defaultModel = dm.trim();
  if (!ZHIPU_MODEL_IDS.includes(defaultModel)) {
    return { ok: false, error: `defaultModel 不是已支持的智谱模型: ${defaultModel}` };
  }

  const log = o.chatLoggingEnabled;
  if (typeof log !== "boolean") {
    return { ok: false, error: "chatLoggingEnabled 须为布尔值" };
  }

  const name = o.appDisplayName;
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, error: "appDisplayName 须为非空字符串" };
  }
  const appDisplayName = name.trim().slice(0, 40);
  if (appDisplayName.length === 0) {
    return { ok: false, error: "appDisplayName 无效" };
  }

  const cse = o.contextSummaryEnabled;
  if (typeof cse !== "boolean") {
    return { ok: false, error: "contextSummaryEnabled 须为布尔值" };
  }

  const csm = o.contextSummaryMaxChars;
  if (
    typeof csm !== "number" ||
    !Number.isInteger(csm) ||
    csm < 200 ||
    csm > 8000
  ) {
    return {
      ok: false,
      error: "contextSummaryMaxChars 须为 200～8000 的整数",
    };
  }

  const csr = o.contextSummaryRefreshEvery;
  if (
    typeof csr !== "number" ||
    !Number.isInteger(csr) ||
    csr < 1 ||
    csr > 200
  ) {
    return {
      ok: false,
      error: "contextSummaryRefreshEvery 须为 1～200 的整数",
    };
  }

  let embeddingApiBaseUrl: string | null = null;
  const ebu = o.embeddingApiBaseUrl;
  if (ebu !== undefined && ebu !== null) {
    if (typeof ebu !== "string") {
      return { ok: false, error: "embeddingApiBaseUrl 须为字符串或 null" };
    }
    const t = ebu.trim();
    if (t) {
      if (!/^https?:\/\//i.test(t)) {
        return {
          ok: false,
          error: "embeddingApiBaseUrl 须以 http:// 或 https:// 开头，或留空",
        };
      }
      if (t.length > 512) {
        return { ok: false, error: "embeddingApiBaseUrl 过长（最多 512 字符）" };
      }
      embeddingApiBaseUrl = t;
    }
  }

  let embeddingModel: string | null = null;
  const em = o.embeddingModel;
  if (em !== undefined && em !== null) {
    if (typeof em !== "string") {
      return { ok: false, error: "embeddingModel 须为字符串或 null" };
    }
    const t = em.trim();
    if (t) {
      if (t.length > 200) {
        return { ok: false, error: "embeddingModel 过长（最多 200 字符）" };
      }
      embeddingModel = t;
    }
  }

  let knowledgeChunkSize = FALLBACK_DEFAULTS.knowledgeChunkSize;
  const kcs = o.knowledgeChunkSize;
  if (kcs !== undefined) {
    if (
      typeof kcs !== "number" ||
      !Number.isInteger(kcs) ||
      kcs < 64 ||
      kcs > 4096
    ) {
      return {
        ok: false,
        error: "knowledgeChunkSize 须为 64～4096 的整数",
      };
    }
    knowledgeChunkSize = kcs;
  }

  let knowledgeChunkOverlap = FALLBACK_DEFAULTS.knowledgeChunkOverlap;
  const kco = o.knowledgeChunkOverlap;
  if (kco !== undefined) {
    if (
      typeof kco !== "number" ||
      !Number.isInteger(kco) ||
      kco < 0 ||
      kco >= knowledgeChunkSize
    ) {
      return {
        ok: false,
        error: `knowledgeChunkOverlap 须为 0～${knowledgeChunkSize - 1} 的整数`,
      };
    }
    knowledgeChunkOverlap = kco;
  }

  const ict = o.intentConfidenceThreshold;
  if (
    typeof ict !== "number" ||
    !Number.isFinite(ict) ||
    ict < 0 ||
    ict > 1
  ) {
    return { ok: false, error: "intentConfidenceThreshold 须为 0～1 的数字" };
  }

  const itn = o.intentSearchTopN;
  if (
    typeof itn !== "number" ||
    !Number.isInteger(itn) ||
    itn < 1 ||
    itn > 20
  ) {
    return { ok: false, error: "intentSearchTopN 须为 1～20 的整数" };
  }

  const ist = o.intentScoreThreshold;
  if (
    typeof ist !== "number" ||
    !Number.isFinite(ist) ||
    ist < -1 ||
    ist > 1
  ) {
    return { ok: false, error: "intentScoreThreshold 须为 -1～1 的数字" };
  }

  return {
    ok: true,
    config: {
      maxMessagesInContext: max,
      defaultProvider,
      defaultModel,
      chatLoggingEnabled: log,
      appDisplayName,
      contextSummaryEnabled: cse,
      contextSummaryMaxChars: csm,
      contextSummaryRefreshEvery: csr,
      embeddingApiBaseUrl,
      embeddingModel,
      knowledgeChunkSize,
      knowledgeChunkOverlap,
      intentConfidenceThreshold: ict,
      intentSearchTopN: itn,
      intentScoreThreshold: ist,
    },
  };
}
