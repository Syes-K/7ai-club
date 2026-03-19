import { fetchDeepseekSseStream, fetchZhipuSseStream } from "@/lib/chat/providers";
import { iterateOpenAIChatStream } from "@/lib/chat/openai-stream";
import { parseAndValidateChatBody } from "@/lib/chat/validate-request";
import { logChat } from "@/lib/chat/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseData(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

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

  const { messages, provider, model } = parsed.data;
  await logChat("info", "api.request_received", {
    requestId,
    provider,
    model: model ?? "deepseek-chat",
    messageCount: messages.length,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(sseData(obj)));
      };

      try {
        const upstream =
          provider === "zhipu"
            ? await fetchZhipuSseStream(messages, model!, requestId)
            : await fetchDeepseekSseStream(messages, requestId);

        let chunkCount = 0;
        let totalChars = 0;
        let fullText = "";

        for await (const text of iterateOpenAIChatStream(upstream)) {
          chunkCount += 1;
          totalChars += text.length;
          fullText += text;
          send({ type: "delta", text });
        }
        send({ type: "done" });
        await logChat("info", "api.stream_completed", {
          requestId,
          provider,
          model: model ?? "deepseek-chat",
          chunkCount,
          totalChars,
          // 避免日志过大，只保留前 4000 字符作为排查用预览
          responsePreview: fullText.slice(0, 4000),
          elapsedMs: Date.now() - startedAt,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : "未知错误";
        await logChat("error", "api.stream_failed", {
          requestId,
          provider,
          model: model ?? "deepseek-chat",
          elapsedMs: Date.now() - startedAt,
          error: message,
        });
        send({ type: "error", message });
      } finally {
        controller.close();
      }
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
