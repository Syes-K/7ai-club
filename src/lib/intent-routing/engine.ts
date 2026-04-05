import { DEEPSEEK_DEFAULT_MODEL } from "@/lib/provider/constants";
import { logChat } from "@/lib/chat/logger";
import {
  fetchChatUpstreamSseStream,
} from "@/lib/provider/providers";
import { iterateOpenAIChatStream } from "@/lib/chat/openai-stream";
import type { ChatMessage } from "@/lib/chat/types";
import {
  buildModelMessagesFromState,
  NODE_EXECUTOR_REGISTRY,
  toTrace,
  type RuntimeState,
} from "./executors";
import type { IntentRoutingConfig, NodeExecutionTrace } from "./types";

export type ExecuteOnceResult = {
  traceId: string;
  requestId: string;
  isIntentHit: boolean;
  matchedIntentId: string | null;
  confidence: number;
  fallbackReason: RuntimeState["fallbackReason"] | null;
  retrievalCount: number;
  finalResponse: string;
  traces: NodeExecutionTrace[];
};

export type ExecuteStreamDoneResult = ExecuteOnceResult;

export type ExecuteStreamResult = {
  stream: ReadableStream<Uint8Array>;
  done: Promise<ExecuteStreamDoneResult>;
};

function buildNodeStateSnapshot(state: RuntimeState) {
  return {
    queryLength: state.query.length,
    forcedIntentId: state.forcedIntentId ?? null,
    matchedIntentId: state.matchedIntent?.intentId ?? null,
    confidence: state.confidence ?? null,
    retrievalCount: state.retrievalHits.length,
    contextMessageCount: state.contextMessages?.length ?? 0,
    fallbackReason: state.fallbackReason ?? null,
    hasModelAnswer: Boolean(state.modelAnswer),
  };
}

function buildNodeInput(
  nodeType: keyof typeof NODE_EXECUTOR_REGISTRY,
  state: RuntimeState
): Record<string, unknown> {
  switch (nodeType) {
    case "intent_recognition":
      return {
        query: state.query,
        forcedIntentId: state.forcedIntentId ?? null,
      };
    case "knowledge_search":
      return {
        query: state.query,
        matchedIntentId: state.matchedIntent?.intentId ?? null,
      };
    case "model_request":
      return {
        query: state.query,
        retrievalCount: state.retrievalHits.length,
        contextMessageCount: state.contextMessages?.length ?? 0,
        retrievalHits: state.retrievalHits.map((h) => ({
          chunkId: h.chunkId,
          score: h.score,
          kbEntryId: h.kbEntryId,
        })),
      };
    case "final_response":
      return {
        query: state.query,
        hasModelAnswer: Boolean(state.modelAnswer),
      };
    default:
      return { query: state.query };
  }
}

function buildNodeOutput(
  _nodeType: keyof typeof NODE_EXECUTOR_REGISTRY,
  state: RuntimeState,
  meta: Record<string, unknown> | undefined,
  status: "success" | "fallback" | "error"
): Record<string, unknown> {
  return {
    status,
    meta: meta ?? null,
    matchedIntentId: state.matchedIntent?.intentId ?? null,
    confidence: state.confidence ?? null,
    fallbackReason: state.fallbackReason ?? null,
    retrievalCount: state.retrievalHits.length,
    hasModelAnswer: Boolean(state.modelAnswer),
  };
}

/**
 * 固定四节点最小可用执行流：
 * intent_recognition -> (hit ? knowledge_search : model_request) -> final_response
 */
export async function executeIntentRoutingOnce(params: {
  query: string;
  config: IntentRoutingConfig;
  intentId?: string;
  assistantSystemPrompt?: string | null;
  contextMessages?: ChatMessage[] | null;
}): Promise<ExecuteOnceResult> {
  const traceId = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  const state: RuntimeState = {
    query: params.query.trim(),
    forcedIntentId: params.intentId?.trim() || undefined,
    retrievalHits: [],
    assistantSystemPrompt: params.assistantSystemPrompt,
    contextMessages:
      params.contextMessages && params.contextMessages.length > 0
        ? params.contextMessages
        : undefined,
  };
  const ctx = { traceId, requestId, config: params.config, state };
  const traces: NodeExecutionTrace[] = [];

  const runNode = async (nodeId: string, type: keyof typeof NODE_EXECUTOR_REGISTRY) => {
    const executor = NODE_EXECUTOR_REGISTRY[type];
    const startedAt = Date.now();
    await logChat("info", "intent_routing.node.start", {
      traceId,
      requestId,
      nodeId,
      nodeType: type,
      input: buildNodeInput(type, state),
      state: buildNodeStateSnapshot(state),
    });
    const result = await executor(ctx);
    traces.push(toTrace(nodeId, type, startedAt, result, state));
    await logChat("info", "intent_routing.node.end", {
      traceId,
      requestId,
      nodeId,
      nodeType: type,
      durationMs: Date.now() - startedAt,
      status: result.status,
      output: buildNodeOutput(type, state, result.meta, result.status),
      state: buildNodeStateSnapshot(state),
    });
    return result;
  };

  const r1 = await runNode("intent_recognition", "intent_recognition");
  if (r1.status === "error") {
    throw new Error("RUNTIME_INTENT_FAILED");
  }

  if (r1.status === "success") {
    const r2 = await runNode("knowledge_search", "knowledge_search");
    if (r2.status === "error") {
      throw new Error("RUNTIME_RETRIEVAL_FAILED");
    }
  }

  const r3 = await runNode("model_request", "model_request");
  if (r3.status === "error" || !state.modelAnswer) {
    throw new Error("RUNTIME_MODEL_FAILED");
  }

  const r4 = await runNode("final_response", "final_response");
  if (r4.status === "error") {
    throw new Error("RUNTIME_FINALIZE_FAILED");
  }

  return {
    traceId,
    requestId,
    isIntentHit: Boolean(state.matchedIntent),
    matchedIntentId: state.matchedIntent?.intentId ?? null,
    confidence: state.confidence ?? 0,
    fallbackReason: state.fallbackReason ?? null,
    retrievalCount: state.retrievalHits.length,
    finalResponse: state.modelAnswer,
    traces,
  };
}

export async function executeIntentRoutingStream(params: {
  query: string;
  config: IntentRoutingConfig;
  intentId?: string;
  assistantSystemPrompt?: string | null;
  contextMessages?: ChatMessage[] | null;
}): Promise<ExecuteStreamResult> {
  const traceId = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  const state: RuntimeState = {
    query: params.query.trim(),
    forcedIntentId: params.intentId?.trim() || undefined,
    retrievalHits: [],
    assistantSystemPrompt: params.assistantSystemPrompt,
    contextMessages:
      params.contextMessages && params.contextMessages.length > 0
        ? params.contextMessages
        : undefined,
  };
  const ctx = { traceId, requestId, config: params.config, state };
  const traces: NodeExecutionTrace[] = [];

  const runNode = async (nodeId: string, type: keyof typeof NODE_EXECUTOR_REGISTRY) => {
    const executor = NODE_EXECUTOR_REGISTRY[type];
    const startedAt = Date.now();
    await logChat("info", "intent_routing.node.start", {
      traceId,
      requestId,
      nodeId,
      nodeType: type,
      input: buildNodeInput(type, state),
      state: buildNodeStateSnapshot(state),
    });
    const result = await executor(ctx);
    traces.push(toTrace(nodeId, type, startedAt, result, state));
    await logChat("info", "intent_routing.node.end", {
      traceId,
      requestId,
      nodeId,
      nodeType: type,
      durationMs: Date.now() - startedAt,
      status: result.status,
      output: buildNodeOutput(type, state, result.meta, result.status),
      state: buildNodeStateSnapshot(state),
    });
    return result;
  };

  const r1 = await runNode("intent_recognition", "intent_recognition");
  if (r1.status === "error") {
    throw new Error("RUNTIME_INTENT_FAILED");
  }
  if (r1.status === "success") {
    const r2 = await runNode("knowledge_search", "knowledge_search");
    if (r2.status === "error") {
      throw new Error("RUNTIME_RETRIEVAL_FAILED");
    }
  }

  let resolveDone: (v: ExecuteStreamDoneResult) => void;
  let rejectDone: (err: unknown) => void;
  const done = new Promise<ExecuteStreamDoneResult>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      const modelStartedAt = Date.now();
      try {
        await logChat("info", "intent_routing.node.start", {
          traceId,
          requestId,
          nodeId: "model_request",
          nodeType: "model_request",
          input: buildNodeInput("model_request", state),
          state: buildNodeStateSnapshot(state),
        });
        const provider = ctx.config.chatRoute.provider;
        const model = ctx.config.chatRoute.model;
        const messages = buildModelMessagesFromState({
          query: state.query,
          retrievalHits: state.retrievalHits,
          assistantSystemPrompt: state.assistantSystemPrompt,
          contextMessages: state.contextMessages,
        });
        const upstream = await fetchChatUpstreamSseStream({
          provider,
          model,
          messages,
          requestId,
        });

        let fullText = "";
        for await (const text of iterateOpenAIChatStream(upstream)) {
          fullText += text;
          send({ type: "delta", text });
        }
        state.modelAnswer = fullText;
        traces.push(
          toTrace(
            "model_request",
            "model_request",
            modelStartedAt,
            {
              status: "success",
              meta: {
                provider,
                model: model ?? DEEPSEEK_DEFAULT_MODEL,
                usedKnowledgeCount: state.retrievalHits.length,
              },
            },
            state
          )
        );
        await logChat("info", "intent_routing.node.end", {
          traceId,
          requestId,
          nodeId: "model_request",
          nodeType: "model_request",
          durationMs: Date.now() - modelStartedAt,
          status: "success",
          output: buildNodeOutput(
            "model_request",
            state,
            {
              provider,
              model: model ?? DEEPSEEK_DEFAULT_MODEL,
              usedKnowledgeCount: state.retrievalHits.length,
              streamedChars: fullText.length,
            },
            "success"
          ),
          state: buildNodeStateSnapshot(state),
        });

        const r4 = await runNode("final_response", "final_response");
        if (r4.status === "error") {
          throw new Error("RUNTIME_FINALIZE_FAILED");
        }

        send({ type: "done" });
        controller.close();
        resolveDone({
          traceId,
          requestId,
          isIntentHit: Boolean(state.matchedIntent),
          matchedIntentId: state.matchedIntent?.intentId ?? null,
          confidence: state.confidence ?? 0,
          fallbackReason: state.fallbackReason ?? null,
          retrievalCount: state.retrievalHits.length,
          finalResponse: state.modelAnswer ?? "",
          traces,
        });
      } catch (e) {
        await logChat("error", "intent_routing.node.end", {
          traceId,
          requestId,
          nodeId: "model_request",
          nodeType: "model_request",
          durationMs: Date.now() - modelStartedAt,
          status: "error",
          output: buildNodeOutput(
            "model_request",
            state,
            {
              error: e instanceof Error ? e.message : String(e),
            },
            "error"
          ),
          error: e instanceof Error ? e.message : String(e),
          state: buildNodeStateSnapshot(state),
        });
        send({ type: "error", message: e instanceof Error ? e.message : String(e) });
        controller.close();
        rejectDone(e);
      }
    },
  });

  return { stream, done };
}
