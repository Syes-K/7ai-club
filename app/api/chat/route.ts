export const runtime = "nodejs";
/** Keep in sync with CHAT_FUNCTION_MAX_DURATION_SEC in lib/llm/timeout.ts and vercel.json */
export const maxDuration = 130;

import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { getChatModel, getLlmConfigError } from "@/lib/llm/provider";
import {
  CHAT_CHUNK_TIMEOUT_MS,
  getLlmTimeoutMs,
  mergeAbortSignals,
} from "@/lib/llm/timeout";
import {
  getAssistantForConversation,
  getConversationForUser,
  getTextFromUIMessage,
  loadMessages,
  maybeUpdateConversationTitle,
  saveAssistantMessage,
  saveUserMessage,
} from "@/lib/chat/conversations";
import { createClient } from "@/lib/supabase/server";

type ChatRequestBody = {
  conversationId?: string;
  message?: UIMessage;
};

export async function POST(req: Request) {
  const configError = getLlmConfigError();
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

  const conversation = await getConversationForUser(conversationId, user.id);
  if (!conversation) {
    return new Response("Conversation not found", { status: 404 });
  }

  const previousMessages = await loadMessages(conversationId);
  const uiMessages: UIMessage[] = [...previousMessages, message];

  try {
    await saveUserMessage(conversationId, message);
    await maybeUpdateConversationTitle(conversationId, userText);
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to save message",
      { status: 500 },
    );
  }

  const assistant = await getAssistantForConversation(conversationId);
  const llmTimeoutMs = getLlmTimeoutMs();

  try {
    const result = streamText({
      model: getChatModel(assistant.model),
      system: assistant.system_prompt,
      messages: await convertToModelMessages(uiMessages),
      abortSignal: mergeAbortSignals(req.signal, AbortSignal.timeout(llmTimeoutMs)),
      timeout: { totalMs: llmTimeoutMs, chunkMs: CHAT_CHUNK_TIMEOUT_MS },
      onError: ({ error }) => {
        console.error("LLM stream error:", error);
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: uiMessages,
      onFinish: async ({ responseMessage }) => {
        try {
          await saveAssistantMessage(conversationId, responseMessage);
        } catch (error) {
          console.error("Failed to save assistant message:", error);
        }
      },
    });
  } catch (error) {
    console.error("LLM error:", error);
    return new Response(
      error instanceof Error ? error.message : "LLM request failed",
      { status: 502 },
    );
  }
}
