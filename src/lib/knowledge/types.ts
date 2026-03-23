/** pending：待索引；indexing：进行中；ready：已向量化；failed：失败（见 indexError）。 */
export type IndexStatus = "pending" | "indexing" | "ready" | "failed";

export type KnowledgeBase = {
  id: string;
  name: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
  entryCount: number;
};

export type KnowledgeEntry = {
  id: string;
  baseId: string;
  title: string | null;
  body: string;
  indexStatus: IndexStatus;
  indexError: string | null;
  createdAt: number;
  updatedAt: number;
};

export type SearchHit = {
  chunkId: string;
  entryId: string;
  chunkIndex: number;
  text: string;
  charStart: number;
  charEnd: number;
  score: number;
};
