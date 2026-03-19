/**
 * 解析 OpenAI 兼容的 SSE 流（智谱 v4、DeepSeek 均兼容此 delta 格式）
 */
export async function* iterateOpenAIChatStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const rawLine = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        const line = rawLine.trim();
        if (!line || line.startsWith(":")) continue;
        if (line === "data: [DONE]") continue;
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string | null } }>;
            error?: { message?: string };
          };
          if (json.error?.message) {
            throw new Error(json.error.message);
          }
          const content = json.choices?.[0]?.delta?.content;
          if (typeof content === "string" && content.length > 0) {
            yield content;
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
