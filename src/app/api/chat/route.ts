import { fetchDeepseekSseStream, fetchZhipuSseStream } from "@/lib/chat/providers";
import { iterateOpenAIChatStream } from "@/lib/chat/openai-stream";
import { parseAndValidateChatBody } from "@/lib/chat/validate-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseData(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }

  const parsed = parseAndValidateChatBody(json);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { messages, provider, model } = parsed.data;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(sseData(obj)));
      };

      try {
        const upstream =
          provider === "zhipu"
            ? await fetchZhipuSseStream(messages, model!)
            : await fetchDeepseekSseStream(messages);

        for await (const text of iterateOpenAIChatStream(upstream)) {
          send({ type: "delta", text });
        }
        send({ type: "done" });
      } catch (e) {
        const message = e instanceof Error ? e.message : "未知错误";
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
