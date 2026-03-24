/** 知识库领域模块对外入口（类型、校验、存储、分块、嵌入、索引编排）。 */
export type { KnowledgeBase, KnowledgeEntry, IndexStatus, SearchHit } from "./types";
export {
  validateBaseName,
  validateEntryTitle,
  validateEntryBody,
} from "./validate";
export { getKnowledgeStore, KnowledgeSqliteStore } from "./store/sqlite-store";
export { getKnowledgeSqlitePath } from "./paths";
export { chunkText } from "./chunk";
export { readEmbeddingConfig, embedTexts, EMBED_BATCH_MAX } from "./embed";
export {
  reindexEntry,
  searchKnowledgeBase,
  searchKnowledgeEntries,
  createEntryAndIndex,
  updateEntryAndIndex,
  updateEntryMetaOnly,
  updateEntryBodyAndIndex,
} from "./pipeline";
