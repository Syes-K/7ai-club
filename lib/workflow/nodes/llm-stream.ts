import {
  convertToModelMessages,
  streamText,
  type UIMessageStreamWriter,
} from "ai";
import { saveAssistantMessage } from "@/lib/chat/conversations";
import { classifyLlmError } from "@/lib/llm/errors";
import { getChatModelForResolvedConfig } from "@/lib/llm/provider";
import { getStreamTextProviderOptions } from "@/lib/llm/stream-options";
import {
  getChatChunkTimeoutMs,
  getLlmTimeoutMs,
} from "@/lib/llm/timeout";
import type { WorkflowContext, StepEmitter } from "@/lib/workflow/types";

function buildSystemPrompt(ctx: WorkflowContext): string {
  const base = ctx.assistant?.system_prompt ?? "";
  const memory = ctx.memorySummary?.content?.trim();

  if (!memory) {
    return base;
  }

  return `${base}\n\n## Conversation memory\n${memory}`;
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
    providerOptions: getStreamTextProviderOptions(),
    abortSignal: AbortSignal.timeout(llmTimeoutMs),
    timeout: { totalMs: llmTimeoutMs, chunkMs: getChatChunkTimeoutMs() },
    onError: ({ error }) => {
      console.error("LLM stream error:", {
        kind: classifyLlmError(error),
        error,
      });
    },
  });

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
      onFinish: async ({ responseMessage }) => {
        try {
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
