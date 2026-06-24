import {
  convertToModelMessages,
  streamText,
  type UIMessageStreamWriter,
} from "ai";
import { saveAssistantMessage } from "@/lib/chat/conversations";
import { classifyLlmError } from "@/lib/llm/errors";
import {
  getChatModelForResolvedConfig,
} from "@/lib/llm/provider";
import { getStreamTextProviderOptions } from "@/lib/llm/stream-options";
import {
  getChatChunkTimeoutMs,
  getLlmTimeoutMs,
} from "@/lib/llm/timeout";
import type { WorkflowContext, StepEmitter } from "@/lib/workflow/types";

export async function runLlmStreamNode(
  ctx: WorkflowContext,
  writer: UIMessageStreamWriter,
  emit: StepEmitter,
): Promise<void> {
  if (!ctx.resolved || !ctx.assistant || !ctx.uiMessages) {
    throw new Error("Workflow context is incomplete for LLM streaming");
  }

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
    system: ctx.assistant.system_prompt,
    messages: await convertToModelMessages(ctx.uiMessages),
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
        } catch (error) {
          console.error("Failed to save assistant message:", error);
        }

        await emit({
          runId: ctx.runId,
          nodeId: "llm_stream",
          label: "Generate response",
          status: "success",
          startedAt,
          finishedAt: new Date().toISOString(),
        });
      },
    }),
  );
}
