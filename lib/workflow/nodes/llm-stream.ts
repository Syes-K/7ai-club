import {
  convertToModelMessages,
  streamText,
  type UIMessageStreamWriter,
} from "ai";
import { saveAssistantMessage } from "@/lib/chat/conversations";
import { classifyLlmError } from "@/lib/llm/errors";
import {
  getStreamTextProviderOptions,
  supportsReasoning,
} from "@/lib/llm/model-capabilities";
import { getChatModelForResolvedConfig } from "@/lib/llm/provider";
import {
  getChatChunkTimeoutMs,
  getLlmTimeoutMs,
} from "@/lib/llm/timeout";
import {
  writeWorkflowStepDelta,
} from "@/lib/workflow/emit-step";
import { REASONING_NODE_ID } from "@/lib/workflow/node-catalog";
import type { WorkflowContext, StepEmitter } from "@/lib/workflow/types";

function buildSystemPrompt(ctx: WorkflowContext): string {
  const parts: string[] = [];
  const base = ctx.assistant?.system_prompt?.trim();
  if (base) {
    parts.push(base);
  }

  const memory = ctx.memorySummary?.content?.trim();
  if (memory) {
    parts.push(`## Conversation memory\n${memory}`);
  }

  if (ctx.ragContextText?.trim()) {
    parts.push(`## Retrieved knowledge\n${ctx.ragContextText.trim()}`);
  }

  return parts.join("\n\n");
}

function getReasoningDelta(part: { type: string; delta?: string; text?: string }): string {
  if (part.type !== "reasoning-delta" && part.type !== "reasoning") {
    return "";
  }

  return part.delta ?? part.text ?? "";
}

async function streamReasoningDeltas(options: {
  ctx: WorkflowContext;
  writer: UIMessageStreamWriter;
  emit: StepEmitter;
  stream: AsyncIterable<{ type: string; delta?: string; text?: string }>;
}): Promise<string> {
  const { ctx, writer, emit, stream } = options;
  const startedAt = new Date().toISOString();
  let reasoningText = "";
  let reasoningStarted = false;

  for await (const part of stream) {
    const delta = getReasoningDelta(part);
    if (!delta) {
      continue;
    }

    if (!reasoningStarted) {
      reasoningStarted = true;
      await emit({
        runId: ctx.runId,
        nodeId: REASONING_NODE_ID,
        label: "Reasoning",
        status: "running",
        startedAt,
      });
    }

    reasoningText += delta;
    writeWorkflowStepDelta(writer, {
      runId: ctx.runId,
      nodeId: REASONING_NODE_ID,
      delta,
    });
  }

  if (!reasoningStarted) {
    return "";
  }

  await emit({
    runId: ctx.runId,
    nodeId: REASONING_NODE_ID,
    label: "Reasoning",
    status: "success",
    detail: reasoningText,
    detailFormat: "plain",
    startedAt,
    finishedAt: new Date().toISOString(),
  });

  return reasoningText;
}

export async function runLlmStreamNode(
  ctx: WorkflowContext,
  writer: UIMessageStreamWriter,
  emit: StepEmitter,
): Promise<void> {
  if (!ctx.resolved || !ctx.assistant || !ctx.uiMessages) {
    throw new Error("Workflow context is incomplete for LLM streaming");
  }

  const llmMessages = ctx.llmUiMessages ?? ctx.uiMessages;
  const startedAt = new Date().toISOString();
  const shouldStreamReasoning = supportsReasoning(ctx.resolved);

  await emit({
    runId: ctx.runId,
    nodeId: "llm_stream",
    label: "Generate response",
    status: "running",
    startedAt,
  });

  const llmTimeoutMs = getLlmTimeoutMs();

  const result = streamText({
    model: getChatModelForResolvedConfig(ctx.resolved),
    system: buildSystemPrompt(ctx),
    messages: await convertToModelMessages(llmMessages),
    providerOptions: getStreamTextProviderOptions(ctx.resolved),
    abortSignal: AbortSignal.timeout(llmTimeoutMs),
    timeout: { totalMs: llmTimeoutMs, chunkMs: getChatChunkTimeoutMs() },
    onError: ({ error }) => {
      console.error("LLM stream error:", {
        kind: classifyLlmError(error),
        error,
      });
    },
  });

  const reasoningPromise =
    shouldStreamReasoning
      ? streamReasoningDeltas({
          ctx,
          writer,
          emit,
          stream: result.fullStream,
        })
      : Promise.resolve("");

  let resolveLlmComplete!: () => void;
  let rejectLlmComplete!: (error: unknown) => void;
  const llmComplete = new Promise<void>((resolve, reject) => {
    resolveLlmComplete = resolve;
    rejectLlmComplete = reject;
  });

  writer.merge(
    result.toUIMessageStream({
      originalMessages: ctx.uiMessages,
      sendStart: false,
      sendReasoning: false,
      onFinish: async ({ responseMessage }) => {
        try {
          await reasoningPromise;

          await saveAssistantMessage(
            ctx.conversationId,
            responseMessage,
            ctx.supabase,
          );

          await emit({
            runId: ctx.runId,
            nodeId: "llm_stream",
            label: "Generate response",
            status: "success",
            startedAt,
            finishedAt: new Date().toISOString(),
          });

          resolveLlmComplete();
        } catch (error) {
          rejectLlmComplete(error);
        }
      },
    }),
  );

  await llmComplete;
}
