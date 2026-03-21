import { DEEPSEEK_DEFAULT_MODEL } from "./constants";
import { fetchDeepseekSseStream, fetchZhipuSseStream } from "./providers";
import { iterateOpenAIChatStream } from "./openai-stream";
import { logChat } from "./logger";
import type { ChatMessage, ChatProviderId } from "./types";

function sseData(obj: unknown) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export function createChatCompletionSseStream(params: {
  messages: ChatMessage[];
  provider: ChatProviderId;
  model: string | undefined;
  requestId: string;
  startedAt: number;
  /** 流式正常结束后调用，用于持久化 assistant；抛错会记录日志但不改写已发送的 SSE */
  afterSuccess?: (fullText: string) => Promise<void>;
}): ReadableStream<Uint8Array> {
  const { messages, provider, model, requestId, startedAt, afterSuccess } =
    params;
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
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
          model: model ?? DEEPSEEK_DEFAULT_MODEL,
          chunkCount,
          totalChars,
          responsePreview: fullText.slice(0, 4000),
          elapsedMs: Date.now() - startedAt,
        });
        if (afterSuccess) {
          try {
            await afterSuccess(fullText);
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            await logChat("error", "api.persist_failed", {
              requestId,
              error: message,
            });
          }
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "未知错误";
        await logChat("error", "api.stream_failed", {
          requestId,
          provider,
          model: model ?? DEEPSEEK_DEFAULT_MODEL,
          elapsedMs: Date.now() - startedAt,
          error: message,
        });
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });
}
