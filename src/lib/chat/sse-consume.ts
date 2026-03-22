/**
 * 消费 `/api/chat` 与 `/api/debug` 等同构 SSE：`data: {...}`（type: delta | done | error）。
 */
export async function consumeChatSseStream(
  response: Response,
  onDelta: (t: string) => void
): Promise<{ error?: string }> {
  if (!response.ok) {
    try {
      const j = (await response.json()) as { error?: string };
      return { error: j.error ?? `HTTP ${response.status}` };
    } catch {
      return { error: `HTTP ${response.status}` };
    }
  }

  const reader = response.body?.getReader();
  if (!reader) return { error: "无响应体" };

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      for (const line of block.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        try {
          const j = JSON.parse(payload) as {
            type?: string;
            text?: string;
            message?: string;
          };
          if (j.type === "delta" && typeof j.text === "string") {
            onDelta(j.text);
          }
          if (j.type === "error") {
            return { error: j.message ?? "流式错误" };
          }
          if (j.type === "done") {
            return {};
          }
        } catch {
          /* 忽略单行解析失败 */
        }
      }
    }
  }

  return {};
}
