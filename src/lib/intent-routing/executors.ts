import { DEEPSEEK_DEFAULT_MODEL } from "@/lib/provider/constants";
import type { ChatMessage } from "@/lib/chat/types";
import { getAppConfig } from "@/lib/config";
import { fetchChatCompletionText } from "@/lib/provider/providers";
import { getKnowledgeStore, searchKnowledgeEntries } from "@/lib/knowledge";
import type {
  IntentRoute,
  IntentRoutingConfig,
  IntentRoutingNodeType,
  NodeExecutionTrace,
} from "./types";

export type RuntimeState = {
  query: string;
  forcedIntentId?: string;
  matchedIntent?: IntentRoute;
  confidence?: number;
  retrievalHits: Array<{
    chunkId: string;
    content: string;
    score: number;
    kbEntryId: string;
  }>;
  /**
   * 检索阶段命中的知识库文档（id + 标题，顺序为首次命中顺序），由 knowledge_search 写入；
   * 供 model_request 在提示中附带预览路径与文档名称。
   */
  hitKnowledgeDocuments: Array<{ id: string; title: string | null }>;
  fallbackReason?: "empty_retrieval" | "retrieval_error" | "intent_not_hit";
  modelAnswer?: string;
  /** 会话助手提示词快照；非空时置于模型 messages 最前一条 system */
  assistantSystemPrompt?: string | null;
  /**
   * 多轮上下文：与 `POST /api/chat` 中 `buildMessagesWithContextSummary` 一致
   *（尾窗 K 条 + 可选摘要 system），末条须为当前轮 user。
   */
  contextMessages?: ChatMessage[] | null;
};

export type NodeExecutionContext = {
  traceId: string;
  requestId: string;
  config: IntentRoutingConfig;
  state: RuntimeState;
};

export type IntentRoutingRetrievalHit = RuntimeState["retrievalHits"][number];

export type NodeExecutorResult = {
  status: "success" | "fallback" | "error";
  meta?: Record<string, unknown>;
};

export type NodeExecutor = (
  ctx: NodeExecutionContext
) => Promise<NodeExecutorResult>;

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

const intentRecognitionExecutor: NodeExecutor = async (ctx) => {
  const appCfg = getAppConfig();
  // 强制意图命中阈值，若命中则直接返回成功。
  const confidenceThreshold = appCfg.intentConfidenceThreshold;
  if (ctx.state.forcedIntentId) {
    const forcedRoute = ctx.config.routes.find(
      (route) => route.enabled && route.intentId === ctx.state.forcedIntentId
    );
    if (forcedRoute) {
      ctx.state.confidence = 1;
      ctx.state.matchedIntent = forcedRoute;
      return {
        status: "success",
        meta: {
          isIntentHit: true,
          confidence: 1,
          matchedIntentId: forcedRoute.intentId,
          confidenceThreshold,
          forcedIntent: true,
        },
      };
    }
  }

  const enabledRoutes = ctx.config.routes.filter((route) => route.enabled);
  if (enabledRoutes.length === 0) {
    ctx.state.confidence = 0;
    ctx.state.fallbackReason = "intent_not_hit";
    return {
      status: "fallback",
      meta: {
        isIntentHit: false,
        confidence: 0,
        confidenceThreshold,
        reason: "no_enabled_route",
      },
    };
  }

  try {
    const provider = ctx.config.chatRoute.provider;
    const candidateIntents = enabledRoutes.map((route) => ({
      intentId: route.intentId,
      keywords: route.keywords,
    }));
    const prompt = [
      "你是意图识别器。请根据用户问题，从候选意图中选出最匹配的一个。",
      "你必须只返回 JSON，格式如下：",
      '{"intentId":"<命中的intentId或空字符串>","confidence":0.0,"reason":"<简短原因>"}',
      "要求：",
      "1) confidence 范围 0~1。",
      "2) 若无法明确命中，请返回 intentId 为空字符串，confidence 尽量低。",
      "3) 不要输出 JSON 之外的任何内容。",
      "",
      `用户问题：${ctx.state.query}`,
      `候选意图：${JSON.stringify(candidateIntents)}`,
    ].join("\n");

    const raw = await fetchChatCompletionText({
      provider,
      model: ctx.config.chatRoute.model,
      messages: [{ role: "user", content: prompt }],
      requestId: `${ctx.requestId}:intent`,
    });

    const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as {
      intentId?: unknown;
      confidence?: unknown;
      reason?: unknown;
    };
    const intentId =
      typeof parsed.intentId === "string" ? parsed.intentId.trim() : "";
    const confidence = clamp01(Number(parsed.confidence));
    const matchedRoute = enabledRoutes.find((route) => route.intentId === intentId);

    ctx.state.confidence = confidence;
    if (matchedRoute && confidence >= confidenceThreshold) {
      ctx.state.matchedIntent = matchedRoute;
      return {
        status: "success",
        meta: {
          isIntentHit: true,
          confidence,
          matchedIntentId: matchedRoute.intentId,
          confidenceThreshold,
          reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
          recognizer: "llm",
        },
      };
    }
    ctx.state.fallbackReason = "intent_not_hit";
    return {
      status: "fallback",
      meta: {
        isIntentHit: false,
        confidence,
        confidenceThreshold,
        reason: typeof parsed.reason === "string" ? parsed.reason : undefined,
        recognizer: "llm",
      },
    };
  } catch (e) {
    // 识别异常时回退为未命中，避免中断主流程。
    ctx.state.confidence = 0;
    ctx.state.fallbackReason = "intent_not_hit";
    return {
      status: "fallback",
      meta: {
        isIntentHit: false,
        confidence: 0,
        confidenceThreshold,
        recognizer: "llm",
        error: e instanceof Error ? e.message : String(e),
      },
    };
  }
};

const knowledgeSearchExecutor: NodeExecutor = async (ctx) => {
  ctx.state.hitKnowledgeDocuments = [];
  const appCfg = getAppConfig();
  const topN = appCfg.intentSearchTopN;
  const scoreThreshold = appCfg.intentScoreThreshold;
  const route = ctx.state.matchedIntent;
  if (!route) {
    ctx.state.fallbackReason = "intent_not_hit";
    return { status: "fallback", meta: { retrievalCount: 0 } };
  }
  try {
    const knowledgeSearchNode = ctx.config.nodes.find((node) => node.id === "knowledge_search");
    // 每个意图使用独立的知识库文档映射，避免不同意图共享同一组检索范围。
    const entryIdsByIntentRaw =
      knowledgeSearchNode?.input?.selectedKnowledgeBaseEntryIdsByIntent;
    const routeEntryIdsRaw =
      entryIdsByIntentRaw &&
        typeof entryIdsByIntentRaw === "object" &&
        !Array.isArray(entryIdsByIntentRaw)
        ? (entryIdsByIntentRaw as Record<string, unknown>)[route.intentId]
        : [];
    const configuredEntryIds = Array.isArray(routeEntryIdsRaw)
      ? routeEntryIdsRaw.filter(
        (v): v is string => typeof v === "string" && v.trim().length > 0
      )
      : [];

    const hits = await searchKnowledgeEntries(
      configuredEntryIds,
      ctx.state.query,
      topN
    );
    const filtered = hits
      .filter((h) => h.score >= scoreThreshold)
      .slice(0, topN)
      .map((h) => ({
        chunkId: h.chunkId,
        content: h.text,
        score: h.score,
        kbEntryId: h.entryId,
      }));
    ctx.state.retrievalHits = filtered;
    const uniqueIds = [...new Set(filtered.map((h) => h.kbEntryId))];
    const store = getKnowledgeStore();
    ctx.state.hitKnowledgeDocuments = uniqueIds.map((id) => {
      const e = store.getEntry(id);
      return { id, title: e?.title ?? null };
    });
    if (filtered.length === 0) {
      ctx.state.fallbackReason = "empty_retrieval";
      return {
        status: "fallback",
        meta: {
          retrievalCountBeforeFilter: hits.length,
          retrievalCountAfterFilter: 0,
          scoreThreshold,
          topN,
          hitKnowledgeDocuments: [],
        },
      };
    }
    return {
      status: "success",
      meta: {
        retrievalCountBeforeFilter: hits.length,
        retrievalCountAfterFilter: filtered.length,
        scoreThreshold,
        topN,
        hitKnowledgeDocuments: ctx.state.hitKnowledgeDocuments,
      },
    };
  } catch (e) {
    ctx.state.fallbackReason = "retrieval_error";
    return {
      status: "fallback",
      meta: { error: e instanceof Error ? e.message : String(e) },
    };
  }
};

/** 站内知识库文档 Markdown 预览路径（与 `src/app/knowledge/preview/[entryId]` 一致）。 */
export const KNOWLEDGE_DOC_PREVIEW_PATH = "/knowledge/preview";

const KNOWLEDGE_AUGMENT_SYSTEM = `你是知识增强问答助手。优先基于给定知识片段回答；若片段不足可明确说明并给出稳妥结论。
当用户消息中列出「命中的知识库文档」及 Markdown 预览链接时，请在回答末尾用简短列表复述（文档名称 + \`[文字](路径)\` 链接，路径须与给定内容完全一致）。对话页中链接会在新标签页打开，便于用户查看原文 Markdown 而不中断对话。`;

function formatHitKnowledgeDocLines(
  docs: Array<{ id: string; title: string | null }>
): string {
  if (docs.length === 0) return "";
  return [
    "",
    "---",
    "命中的知识库文档（文档名称与 Markdown 预览链接；用户点击后在新标签页打开）：",
    ...docs.map(({ id, title }) => {
      const href = `${KNOWLEDGE_DOC_PREVIEW_PATH}/${id}`;
      const name = title?.trim() ? title.trim() : "（无标题）";
      return `- **${name}**  ·  [打开预览（新标签页）](${href})`;
    }),
  ].join("\n");
}

function appendKnowledgeUserBlock(
  base: string,
  docs: Array<{ id: string; title: string | null }>
): string {
  const extra = formatHitKnowledgeDocLines(docs);
  return extra ? `${base}${extra}` : base;
}

/** 仅 id 列表时从 store 补全标题（fallback） */
function deriveHitKnowledgeDocumentsFromHits(
  retrievalHits: IntentRoutingRetrievalHit[]
): Array<{ id: string; title: string | null }> {
  const uniqueIds = [...new Set(retrievalHits.map((h) => h.kbEntryId))];
  const store = getKnowledgeStore();
  return uniqueIds.map((id) => {
    const e = store.getEntry(id);
    return { id, title: e?.title ?? null };
  });
}

function prependAssistantSystemChat(
  messages: ChatMessage[],
  prompt: string | undefined | null
): ChatMessage[] {
  const t = prompt?.trim();
  if (!t) return messages;
  return [{ role: "system", content: t }, ...messages];
}

function buildSingleTurnMessages(ctx: NodeExecutionContext): ChatMessage[] {
  const ap = ctx.state.assistantSystemPrompt;
  if (ctx.state.retrievalHits.length === 0) {
    return prependAssistantSystemChat(
      [{ role: "user", content: ctx.state.query }],
      ap
    );
  }
  const knowledge = ctx.state.retrievalHits
    .map(
      (h, idx) =>
        `[${idx + 1}] kb_entry_id=${h.kbEntryId}; score=${h.score.toFixed(4)}\n${h.content}`
    )
    .join("\n\n");
  const userBlock = appendKnowledgeUserBlock(
    `用户问题：${ctx.state.query}\n\n可用知识片段：\n${knowledge}`,
    ctx.state.hitKnowledgeDocuments
  );
  return prependAssistantSystemChat(
    [
      { role: "system", content: KNOWLEDGE_AUGMENT_SYSTEM },
      {
        role: "user",
        content: userBlock,
      },
    ],
    ap
  );
}

function buildModelMessages(ctx: NodeExecutionContext): ChatMessage[] {
  const ap = ctx.state.assistantSystemPrompt;
  const ctxMsgs = ctx.state.contextMessages;

  if (ctxMsgs && ctxMsgs.length > 0) {
    const msgs = [...ctxMsgs];
    const last = msgs[msgs.length - 1];
    if (last.role !== "user") {
      return buildSingleTurnMessages(ctx);
    }
    if (ctx.state.retrievalHits.length === 0) {
      return prependAssistantSystemChat(msgs, ap);
    }
    const knowledge = ctx.state.retrievalHits
      .map(
        (h, idx) =>
          `[${idx + 1}] kb_entry_id=${h.kbEntryId}; score=${h.score.toFixed(4)}\n${h.content}`
      )
      .join("\n\n");
    const prefix = msgs.slice(0, -1);
    const q = last.content;
    const userBlock = appendKnowledgeUserBlock(
      `用户问题：${q}\n\n可用知识片段：\n${knowledge}`,
      ctx.state.hitKnowledgeDocuments
    );
    return prependAssistantSystemChat(
      [
        ...prefix,
        { role: "system", content: KNOWLEDGE_AUGMENT_SYSTEM },
        {
          role: "user",
          content: userBlock,
        },
      ],
      ap
    );
  }

  return buildSingleTurnMessages(ctx);
}

export function buildModelMessagesFromState(params: {
  query: string;
  retrievalHits: IntentRoutingRetrievalHit[];
  /** 未传时从 retrievalHits 去重并用 store 补标题 */
  hitKnowledgeDocuments?: Array<{ id: string; title: string | null }>;
  assistantSystemPrompt?: string | null;
  /** 多轮：与 chat 路由中 `buildMessagesWithContextSummary` 输出一致 */
  contextMessages?: ChatMessage[] | null;
}): ChatMessage[] {
  const hitDocs =
    params.hitKnowledgeDocuments !== undefined
      ? params.hitKnowledgeDocuments
      : deriveHitKnowledgeDocumentsFromHits(params.retrievalHits);
  const fakeCtx = {
    state: {
      query: params.query,
      retrievalHits: params.retrievalHits,
      hitKnowledgeDocuments: hitDocs,
      assistantSystemPrompt: params.assistantSystemPrompt,
      contextMessages:
        params.contextMessages && params.contextMessages.length > 0
          ? params.contextMessages
          : undefined,
    },
  } as NodeExecutionContext;
  return buildModelMessages(fakeCtx);
}

const modelRequestExecutor: NodeExecutor = async (ctx) => {
  const provider = ctx.config.chatRoute.provider;
  const text = await fetchChatCompletionText({
    provider,
    model: ctx.config.chatRoute.model,
    messages: buildModelMessages(ctx),
    requestId: ctx.requestId,
  });
  ctx.state.modelAnswer = text;
  return {
    status: "success",
    meta: {
      provider,
      model: ctx.config.chatRoute.model ?? DEEPSEEK_DEFAULT_MODEL,
      usedKnowledgeCount: ctx.state.retrievalHits.length,
      hitKnowledgeDocumentCount: ctx.state.hitKnowledgeDocuments.length,
    },
  };
};

const finalResponseExecutor: NodeExecutor = async () => ({ status: "success" });

export const NODE_EXECUTOR_REGISTRY: Record<IntentRoutingNodeType, NodeExecutor> = {
  intent_recognition: intentRecognitionExecutor,
  knowledge_search: knowledgeSearchExecutor,
  model_request: modelRequestExecutor,
  final_response: finalResponseExecutor,
  // 本期仅预留类型与注册位，具体业务执行后续迭代再接入。
  skills: async () => ({ status: "error", meta: { code: "CFG_NODE_TYPE_UNSUPPORTED" } }),
  tools: async () => ({ status: "error", meta: { code: "CFG_NODE_TYPE_UNSUPPORTED" } }),
  mcp: async () => ({ status: "error", meta: { code: "CFG_NODE_TYPE_UNSUPPORTED" } }),
};

export function toTrace(
  nodeId: string,
  nodeType: IntentRoutingNodeType,
  startedAt: number,
  result: NodeExecutorResult,
  state: RuntimeState
): NodeExecutionTrace {
  return {
    nodeId,
    nodeType,
    status: result.status,
    durationMs: Date.now() - startedAt,
    ...(state.fallbackReason ? { fallbackReason: state.fallbackReason } : {}),
    ...(result.meta ? { meta: result.meta } : {}),
  };
}
