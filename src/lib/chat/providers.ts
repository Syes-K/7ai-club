import type { ChatMessage } from "./types";
import { DEEPSEEK_DEFAULT_MODEL } from "./constants";

const ZHIPU_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

function toOpenAIMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

/** 返回厂商原始 SSE 字节流（OpenAI 兼容格式） */
export async function fetchZhipuSseStream(
  messages: ChatMessage[],
  model: string
): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.ZHIPU_API_KEY;
  if (!key) {
    throw new Error("服务端未配置 ZHIPU_API_KEY");
  }

  const res = await fetch(ZHIPU_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: toOpenAIMessages(messages),
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `智谱 API 错误 ${res.status}: ${text.slice(0, 500) || res.statusText}`
    );
  }

  if (!res.body) throw new Error("智谱响应无 body");
  return res.body;
}

export async function fetchDeepseekSseStream(
  messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error("服务端未配置 DEEPSEEK_API_KEY");
  }

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_DEFAULT_MODEL,
      messages: toOpenAIMessages(messages),
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `DeepSeek API 错误 ${res.status}: ${text.slice(0, 500) || res.statusText}`
    );
  }

  if (!res.body) throw new Error("DeepSeek 响应无 body");
  return res.body;
}
