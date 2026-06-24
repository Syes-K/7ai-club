export const runtime = "nodejs";
/** Keep in sync with CHAT_FUNCTION_MAX_DURATION_SEC in lib/llm/timeout.ts and vercel.json */
export const maxDuration = 130;

import { randomUUID } from "node:crypto";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  type UIMessage,
} from "ai";
import { after } from "next/server";
import { getChatLlmConfigError } from "@/lib/llm/provider";
import {
  getTextFromUIMessage,
  maybeUpdateConversationTitle,
  saveUserMessage,
} from "@/lib/chat/conversations";
import { isRedisConfigured } from "@/lib/redis/client";
import { purgeResumableStream } from "@/lib/redis/purge";
import { getResumableStreamContext } from "@/lib/redis/stream-context";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { makeStepEmitter } from "@/lib/workflow/emit-step";
import {
  loadContextNode,
  ModelNotReadyError,
  resolveModelNode,
  runLlmStreamNode,
  validateRequestNode,
} from "@/lib/workflow/nodes";
import {
  cancelStaleRuns,
  clearActiveStreamId,
  createWorkflowRun,
  finishWorkflowRun,
  setActiveStreamId,
  upsertWorkflowStepLog,
} from "@/lib/workflow/persistence";
import { runWorkflow } from "@/lib/workflow/runner";
import type { WorkflowContext } from "@/lib/workflow/types";

type ChatRequestBody = {
  conversationId?: string;
  message?: UIMessage;
};

function scheduleRunCleanup(runId: string, streamId: string): void {
  after(async () => {
    await purgeResumableStream(streamId);
    try {
      const service = createServiceClient();
      await clearActiveStreamId(service, runId);
    } catch (error) {
      console.error("Failed to clear active stream id:", error);
    }
  });
}

export async function POST(req: Request) {
  const configError = getChatLlmConfigError();
  if (configError) {
    console.error("LLM config error:", configError);
    return new Response(configError, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 422 });
  }

  const { conversationId, message } = body;

  if (!conversationId || !message) {
    return new Response("Missing conversationId or message", { status: 422 });
  }

  const userText = getTextFromUIMessage(message);
  if (!userText.trim()) {
    return new Response("Empty message", { status: 422 });
  }

  try {
    await saveUserMessage(conversationId, message);
    await maybeUpdateConversationTitle(conversationId, userText);
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to save message",
      { status: 500 },
    );
  }

  const staleRuns = await cancelStaleRuns(supabase, conversationId, user.id);
  after(async () => {
    for (const stale of staleRuns) {
      await purgeResumableStream(stale.streamId);
    }
  });

  let runId: string;
  try {
    runId = await createWorkflowRun(supabase, {
      conversationId,
      userId: user.id,
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to start workflow",
      { status: 500 },
    );
  }

  const streamId = generateId();
  const assistantMessageId = randomUUID();

  const uiStream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({
        type: "start",
        messageId: assistantMessageId,
      });

      const emit = makeStepEmitter({
        writer,
        runId,
        persistStep: (event) => upsertWorkflowStepLog(supabase, event),
      });

      const ctx: WorkflowContext = {
        runId,
        userId: user.id,
        conversationId,
        message,
        userText,
        supabase,
      };

      try {
        await runWorkflow(
          [validateRequestNode, loadContextNode, resolveModelNode],
          ctx,
          emit,
        );
        await runLlmStreamNode(ctx, writer, emit);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Workflow failed";

        try {
          const service = createServiceClient();
          await finishWorkflowRun(service, runId, "error", errorMessage);
        } catch (finishError) {
          console.error("Failed to finish workflow run:", finishError);
        }

        scheduleRunCleanup(runId, streamId);
        throw error;
      }
    },
    onFinish: async ({ isAborted, finishReason }) => {
      const status =
        isAborted || finishReason === "error" ? "error" : "completed";

      try {
        const service = createServiceClient();
        await finishWorkflowRun(
          service,
          runId,
          status,
          status === "error" ? "Generation failed" : undefined,
        );
      } catch (error) {
        console.error("Failed to finish workflow run:", error);
      }

      scheduleRunCleanup(runId, streamId);
    },
    onError: (error) => {
      if (error instanceof ModelNotReadyError) {
        return error.message;
      }

      return error instanceof Error ? error.message : "An error occurred.";
    },
  });

  return createUIMessageStreamResponse({
    stream: uiStream,
    async consumeSseStream({ stream }) {
      if (!isRedisConfigured()) {
        return;
      }

      const streamContext = await getResumableStreamContext();
      if (!streamContext) {
        return;
      }

      await streamContext.createNewResumableStream(streamId, () => stream);

      try {
        await setActiveStreamId(supabase, runId, streamId);
      } catch (error) {
        console.error("Failed to persist active stream id:", error);
      }
    },
  });
}
