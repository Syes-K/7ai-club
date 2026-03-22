import { createChatCompletionSseStream } from "@/lib/chat/run-chat-stream";
import { parseAndValidateDebugChatBody } from "@/lib/chat/validate-debug-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 调试补全：前端组装 `messages`，SSE 返回；不写聊天落盘日志。
 * 详见 `docs/backend/api-spec-debug.md`（迭代 0.0.7）。
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }

  const parsed = parseAndValidateDebugChatBody(json);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { messages, provider, model } = parsed.data;
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  const stream = createChatCompletionSseStream({
    messages,
    provider,
    model: provider === "zhipu" ? model : undefined,
    requestId,
    startedAt,
    skipChatLog: true,
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
