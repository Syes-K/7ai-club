/**
 * 知识库索引与检索编排：分块 → 批量 Embedding → 写入 SQLite；
 * 与对话路由解耦，仅由 `/api/console/knowledge/*` 等管理端入口调用。
 */
import { chunkText } from "./chunk";
import { EMBED_BATCH_MAX, embedTexts, readEmbeddingConfig } from "./embed";
import { getAppConfig } from "@/lib/config";
import {
  getKnowledgeStore,
  numberArrayToFloat32Buffer,
  searchChunksInBase,
} from "./store/sqlite-store";
import type { KnowledgeEntry, SearchHit } from "./types";

/** 清空旧块、重新分块并向量化；状态经 indexing → ready / failed。 */
export async function reindexEntry(entryId: string): Promise<void> {
  const store = getKnowledgeStore();
  const entry = store.getEntry(entryId);
  if (!entry) return;

  store.setEntryIndexState(entryId, "indexing", null);
  store.deleteChunksForEntry(entryId);

  const cfg = readEmbeddingConfig();
  if (!cfg.ok) {
    store.setEntryIndexState(entryId, "failed", cfg.error);
    return;
  }

  try {
    const appCfg = getAppConfig();
    const pieces = chunkText(
      entry.body,
      appCfg.knowledgeChunkSize,
      appCfg.knowledgeChunkOverlap
    );
    if (pieces.length === 0) {
      store.setEntryIndexState(entryId, "ready", null);
      return;
    }

    const model = cfg.config.model;
    // 按 EMBED_BATCH_MAX 分批请求，避免单次 input 过大
    for (let i = 0; i < pieces.length; i += EMBED_BATCH_MAX) {
      const batch = pieces.slice(i, i + EMBED_BATCH_MAX);
      const texts = batch.map((p) => p.text);
      const vectors = await embedTexts(texts, cfg.config);
      for (let j = 0; j < batch.length; j++) {
        const p = batch[j];
        const vec = vectors[j];
        const buf = numberArrayToFloat32Buffer(vec);
        // chunk_index 与 chunkText 产出顺序一致，全局序号 = 批次起点 i + 批内 j
        store.insertChunk(
          entryId,
          i + j,
          p.text,
          p.charStart,
          p.charEnd,
          model,
          vec.length,
          buf
        );
      }
    }
    store.setEntryIndexState(entryId, "ready", null);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    store.setEntryIndexState(entryId, "failed", msg);
  }
}

/** 查询句 embedding 后与库内已存向量做点积 topK（向量均已 L2 归一化，等价余弦相似度）。 */
export async function searchKnowledgeBase(
  baseId: string,
  query: string,
  topK: number
): Promise<SearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cfg = readEmbeddingConfig();
  if (!cfg.ok) {
    throw new Error(cfg.error);
  }

  const vectors = await embedTexts([trimmed], cfg.config);
  const qv = vectors[0];
  const store = getKnowledgeStore();
  return searchChunksInBase(store, baseId, qv, topK);
}

/** 插入条目后立即完整走一遍 reindexEntry。 */
export async function createEntryAndIndex(
  baseId: string,
  title: string | null,
  body: string
): Promise<KnowledgeEntry> {
  const store = getKnowledgeStore();
  const entry = store.insertEntry(baseId, title, body, "pending", null);
  await reindexEntry(entry.id);
  const updated = store.getEntry(entry.id);
  return updated ?? entry;
}

/**
 * 仅正文变更时删除旧块并重索引；只改标题不触发 Embedding，节省成本。
 */
export async function updateEntryAndIndex(
  entryId: string,
  patch: { title?: string | null; body?: string }
): Promise<KnowledgeEntry | null> {
  const store = getKnowledgeStore();
  const cur = store.getEntry(entryId);
  if (!cur) return null;

  const bodyChanged =
    patch.body !== undefined && patch.body !== cur.body;
  const p: {
    title?: string | null;
    body?: string;
    indexStatus?: "pending";
    indexError?: null;
  } = {};
  if (patch.title !== undefined) p.title = patch.title;
  if (patch.body !== undefined) p.body = patch.body;
  if (bodyChanged) {
    p.indexStatus = "pending";
    p.indexError = null;
  }

  const next = store.updateEntryContent(entryId, p);
  if (!next) return null;
  if (bodyChanged) {
    await reindexEntry(entryId);
    return store.getEntry(entryId);
  }
  return next;
}

/**
 * 仅更新条目元信息（目前仅标题），不触发重索引。
 * 适用于“标题改了但正文不变”的场景，避免不必要的 Embedding 调用。
 */
export async function updateEntryMetaOnly(
  entryId: string,
  patch: { title?: string | null }
): Promise<KnowledgeEntry | null> {
  const store = getKnowledgeStore();
  const next = store.updateEntryContent(entryId, patch);
  if (!next) return null;
  // 仅标题更新不会修改 index_status/index_error
  return next;
}

/**
 * 仅更新正文并触发重索引。
 * 适用于“正文改了必须重新向量化”的场景，状态经 indexing → ready/failed。
 */
export async function updateEntryBodyAndIndex(
  entryId: string,
  body: string
): Promise<KnowledgeEntry | null> {
  const store = getKnowledgeStore();
  const cur = store.getEntry(entryId);
  if (!cur) return null;

  // 正文变更：置 pending 并清空 index_error；随后重建块与向量
  const next = store.updateEntryContent(entryId, {
    body,
    indexStatus: "pending",
    indexError: null,
  });
  if (!next) return null;

  await reindexEntry(entryId);
  return store.getEntry(entryId);
}
