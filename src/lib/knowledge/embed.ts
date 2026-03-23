/**
 * OpenAI 兼容 Embeddings API。
 * baseUrl / model：环境变量 > 应用配置（与对话默认模型同属 `app-config.json`）> 内置默认；
 * API Key 仍仅来自环境变量 `KNOWLEDGE_EMBEDDING_API_KEY`。
 */
import { getAppConfig } from "@/lib/config";
import { l2Normalize } from "./vector";


export type EmbeddingConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

/** 缺少 KNOWLEDGE_EMBEDDING_API_KEY 时返回 ok:false，由调用方将条目标为 failed。 */
export function readEmbeddingConfig():
  | { ok: true; config: EmbeddingConfig }
  | { ok: false; error: string } {
  const apiKey = process.env.KNOWLEDGE_EMBEDDING_API_KEY?.trim() ?? "";
  if (!apiKey) {
    return { ok: false, error: "未配置 KNOWLEDGE_EMBEDDING_API_KEY，无法生成向量" };
  }

  const app = getAppConfig();
  const envBase = process.env.KNOWLEDGE_EMBEDDING_BASE_URL?.trim() ?? "";
  const fromFileBase = app.embeddingApiBaseUrl?.trim() ?? "";
  const baseUrlRaw = envBase || fromFileBase;

  const envModel = process.env.KNOWLEDGE_EMBEDDING_MODEL?.trim() ?? "";
  const fromFileModel = app.embeddingModel?.trim() ?? "";
  const model = envModel || fromFileModel;

  return {
    ok: true,
    config: {
      baseUrl: baseUrlRaw.replace(/\/$/, ""),
      apiKey,
      model,
    },
  };
}

type OpenAIEmbeddingResponse = {
  data?: { embedding: number[]; index: number }[];
  error?: { message?: string };
};

/** 单批调用；返回与输入顺序一致的归一化向量。 */
export async function embedTexts(
  texts: string[],
  config: EmbeddingConfig
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const url = `${config.baseUrl}/embeddings`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ model: config.model, input: texts }),
  });
  const raw = await res.text();
  let json: OpenAIEmbeddingResponse | null = null;
  if (raw.trim()) {
    try {
      json = JSON.parse(raw) as OpenAIEmbeddingResponse;
    } catch {
      if (!res.ok) {
        throw new Error(
          `Embedding API 错误: HTTP ${res.status}，返回非 JSON: ${raw.slice(0, 300)}`
        );
      }
      throw new Error(`Embedding API 返回非 JSON: ${raw.slice(0, 300)}`);
    }
  }
  if (!res.ok) {
    const msg = json?.error?.message ?? (raw.trim() || res.statusText);
    throw new Error(`Embedding API 错误: ${msg}`);
  }
  const data = json?.data;
  if (!data || data.length !== texts.length) {
    throw new Error("Embedding API 返回数据条数与输入不一致");
  }
  const sorted = [...data].sort((a, b) => a.index - b.index);
  return sorted.map((d) => l2Normalize(d.embedding));
}

/** 与上游 API 单次 `input` 数组长度上限对齐，见 pipeline 分批循环。 */
export const EMBED_BATCH_MAX = 20;
