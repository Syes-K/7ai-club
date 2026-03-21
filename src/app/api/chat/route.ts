import { parseAndValidateChatBody } from "@/lib/chat/validate-request";
import { logChat } from "@/lib/chat/logger";
import { createChatCompletionSseStream } from "@/lib/chat/run-chat-stream";
import { getChatStore, storedToChatMessages } from "@/lib/chat/store";
import { DEEPSEEK_DEFAULT_MODEL } from "@/lib/chat/constants";
import { getAppConfig } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    await logChat("warn", "api.invalid_json", { requestId });
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }

  const parsed = parseAndValidateChatBody(json);
  if (!parsed.ok) {
    await logChat("warn", "api.validation_failed", {
      requestId,
      error: parsed.error,
    });
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const body = parsed.data;

  if (body.variant === "legacy") {
    const { messages, provider, model } = body;
    await logChat("info", "api.request_received", {
      requestId,
      mode: "legacy",
      provider,
      model: model ?? DEEPSEEK_DEFAULT_MODEL,
      messageCount: messages.length,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const stream = createChatCompletionSseStream({
      messages,
      provider,
      model,
      requestId,
      startedAt,
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const store = getChatStore();
  const { sessionId, provider, model, retryLast, content } = body;

  if (!store.sessionExists(sessionId)) {
    await logChat("warn", "api.session_not_found", { requestId, sessionId });
    return Response.json({ error: "会话不存在" }, { status: 404 });
  }

  if (retryLast) {
    const rows = store.listMessages(sessionId);
    const last = rows[rows.length - 1];
    if (!last || last.role !== "user") {
      await logChat("warn", "api.retry_invalid", {
        requestId,
        sessionId,
        lastRole: last?.role,
      });
      return Response.json(
        { error: "当前无法重试：上一条持久化消息不是用户消息" },
        { status: 400 }
      );
    }
  } else {
    store.appendMessage(sessionId, "user", content!);
    store.maybeSetTitleFromUserMessage(sessionId, content!);
  }

  const rows = store.listMessages(sessionId);
  const messages = storedToChatMessages(rows).slice(
    -getAppConfig().maxMessagesInContext
  );

  await logChat("info", "api.request_received", {
    requestId,
    mode: "session",
    sessionId,
    retryLast,
    provider,
    model: model ?? DEEPSEEK_DEFAULT_MODEL,
    messageCount: messages.length,
  });

  const stream = createChatCompletionSseStream({
    messages,
    provider,
    model,
    requestId,
    startedAt,
    afterSuccess: async (fullText) => {
      store.appendMessage(sessionId, "assistant", fullText);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
