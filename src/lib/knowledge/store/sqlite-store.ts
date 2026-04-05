/**
 * 知识库 SQLite 持久化：库 / 文档(entry) / 块+向量同库；与聊天表共用同一 db 文件。
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { IndexStatus, KnowledgeBase, KnowledgeEntry, SearchHit } from "../types";
import {
  bufferToFloat32Array,
  dot,
  numberArrayToFloat32Buffer,
} from "../vector";
import { getKnowledgeSqlitePath } from "../paths";

/** IF NOT EXISTS，多次启动与多实例共文件时安全。 */
function migrateKnowledge(db: Database.Database) {
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_bases (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS knowledge_entries (
      id TEXT PRIMARY KEY NOT NULL,
      base_id TEXT NOT NULL,
      title TEXT,
      body TEXT NOT NULL,
      index_status TEXT NOT NULL,
      index_error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (base_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_knowledge_entries_base ON knowledge_entries(base_id);
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id TEXT PRIMARY KEY NOT NULL,
      entry_id TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      text TEXT NOT NULL,
      char_start INTEGER NOT NULL,
      char_end INTEGER NOT NULL,
      embedding_model TEXT NOT NULL,
      embedding_dim INTEGER NOT NULL,
      embedding BLOB NOT NULL,
      FOREIGN KEY (entry_id) REFERENCES knowledge_entries(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_entry ON knowledge_chunks(entry_id);
  `);
}

export class KnowledgeSqliteStore {
  private readonly db: Database.Database;

  constructor(dbFilePath: string) {
    const dir = path.dirname(dbFilePath);
    fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(dbFilePath);
    migrateKnowledge(this.db);
  }

  listBases(): KnowledgeBase[] {
    const rows = this.db
      .prepare(
        `SELECT b.id AS id, b.name AS name, b.description AS description,
                b.created_at AS createdAt, b.updated_at AS updatedAt,
                (SELECT COUNT(*) FROM knowledge_entries e WHERE e.base_id = b.id) AS entryCount
         FROM knowledge_bases b
         ORDER BY b.updated_at DESC`
      )
      .all() as {
      id: string;
      name: string;
      description: string | null;
      createdAt: number;
      updatedAt: number;
      entryCount: number;
    }[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      entryCount: Number(r.entryCount),
    }));
  }

  getBase(id: string): KnowledgeBase | null {
    const row = this.db
      .prepare(
        `SELECT b.id AS id, b.name AS name, b.description AS description,
                b.created_at AS createdAt, b.updated_at AS updatedAt,
                (SELECT COUNT(*) FROM knowledge_entries e WHERE e.base_id = b.id) AS entryCount
         FROM knowledge_bases b WHERE b.id = ?`
      )
      .get(id) as
      | {
          id: string;
          name: string;
          description: string | null;
          createdAt: number;
          updatedAt: number;
          entryCount: number;
        }
      | undefined;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      entryCount: Number(row.entryCount),
    };
  }

  createBase(name: string, description: string | null): KnowledgeBase {
    const id = crypto.randomUUID();
    const now = Date.now();
    this.db
      .prepare(
        `INSERT INTO knowledge_bases (id, name, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(id, name, description, now, now);
    return {
      id,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      entryCount: 0,
    };
  }

  updateBase(
    id: string,
    patch: { name?: string; description?: string | null }
  ): boolean {
    const base = this.db
      .prepare(`SELECT id FROM knowledge_bases WHERE id = ?`)
      .get(id) as { id: string } | undefined;
    if (!base) return false;
    const now = Date.now();
    if (patch.name !== undefined) {
      this.db
        .prepare(
          `UPDATE knowledge_bases SET name = ?, updated_at = ? WHERE id = ?`
        )
        .run(patch.name, now, id);
    }
    if (patch.description !== undefined) {
      this.db
        .prepare(
          `UPDATE knowledge_bases SET description = ?, updated_at = ? WHERE id = ?`
        )
        .run(patch.description, now, id);
    }
    return true;
  }

  deleteBase(id: string): boolean {
    const r = this.db.prepare(`DELETE FROM knowledge_bases WHERE id = ?`).run(id);
    return r.changes > 0;
  }

  nameExists(name: string, excludeId?: string): boolean {
    if (excludeId) {
      const row = this.db
        .prepare(
          `SELECT 1 AS ok FROM knowledge_bases WHERE name = ? AND id != ? LIMIT 1`
        )
        .get(name, excludeId) as { ok: number } | undefined;
      return Boolean(row);
    }
    const row = this.db
      .prepare(`SELECT 1 AS ok FROM knowledge_bases WHERE name = ? LIMIT 1`)
      .get(name) as { ok: number } | undefined;
    return Boolean(row);
  }

  listEntries(baseId: string): KnowledgeEntry[] {
    const rows = this.db
      .prepare(
        `SELECT id, base_id AS baseId, title, body, index_status AS indexStatus,
                index_error AS indexError, created_at AS createdAt, updated_at AS updatedAt
         FROM knowledge_entries WHERE base_id = ? ORDER BY updated_at DESC`
      )
      .all(baseId) as KnowledgeEntry[];
    return rows;
  }

  getEntry(entryId: string): KnowledgeEntry | null {
    const row = this.db
      .prepare(
        `SELECT id, base_id AS baseId, title, body, index_status AS indexStatus,
                index_error AS indexError, created_at AS createdAt, updated_at AS updatedAt
         FROM knowledge_entries WHERE id = ?`
      )
      .get(entryId) as KnowledgeEntry | undefined;
    return row ?? null;
  }

  insertEntry(
    baseId: string,
    title: string | null,
    body: string,
    indexStatus: IndexStatus,
    indexError: string | null
  ): KnowledgeEntry {
    const id = crypto.randomUUID();
    const now = Date.now();
    this.db
      .prepare(
        `INSERT INTO knowledge_entries
         (id, base_id, title, body, index_status, index_error, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, baseId, title, body, indexStatus, indexError, now, now);
    this.touchBase(baseId, now);
    return {
      id,
      baseId,
      title,
      body,
      indexStatus,
      indexError,
      createdAt: now,
      updatedAt: now,
    };
  }

  updateEntryContent(
    entryId: string,
    patch: {
      title?: string | null;
      body?: string;
      indexStatus?: IndexStatus;
      indexError?: string | null;
    }
  ): KnowledgeEntry | null {
    const cur = this.getEntry(entryId);
    if (!cur) return null;
    const now = Date.now();
    const title = patch.title !== undefined ? patch.title : cur.title;
    const body = patch.body !== undefined ? patch.body : cur.body;
    const indexStatus = patch.indexStatus ?? cur.indexStatus;
    const indexError =
      patch.indexError !== undefined ? patch.indexError : cur.indexError;
    this.db
      .prepare(
        `UPDATE knowledge_entries SET title = ?, body = ?, index_status = ?, index_error = ?, updated_at = ? WHERE id = ?`
      )
      .run(title, body, indexStatus, indexError, now, entryId);
    this.touchBase(cur.baseId, now);
    return this.getEntry(entryId);
  }

  deleteEntry(entryId: string): boolean {
    const cur = this.getEntry(entryId);
    if (!cur) return false;
    const r = this.db
      .prepare(`DELETE FROM knowledge_entries WHERE id = ?`)
      .run(entryId);
    if (r.changes > 0) {
      this.touchBase(cur.baseId, Date.now());
      return true;
    }
    return false;
  }

  setEntryIndexState(
    entryId: string,
    status: IndexStatus,
    indexError: string | null
  ): void {
    const cur = this.getEntry(entryId);
    if (!cur) return;
    const now = Date.now();
    this.db
      .prepare(
        `UPDATE knowledge_entries SET index_status = ?, index_error = ?, updated_at = ? WHERE id = ?`
      )
      .run(status, indexError, now, entryId);
    this.touchBase(cur.baseId, now);
  }

  deleteChunksForEntry(entryId: string): void {
    this.db.prepare(`DELETE FROM knowledge_chunks WHERE entry_id = ?`).run(entryId);
  }

  insertChunk(
    entryId: string,
    chunkIndex: number,
    text: string,
    charStart: number,
    charEnd: number,
    model: string,
    dim: number,
    embedding: Buffer
  ): void {
    const id = crypto.randomUUID();
    this.db
      .prepare(
        `INSERT INTO knowledge_chunks
         (id, entry_id, chunk_index, text, char_start, char_end, embedding_model, embedding_dim, embedding)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        entryId,
        chunkIndex,
        text,
        charStart,
        charEnd,
        model,
        dim,
        embedding
      );
  }

  private touchBase(baseId: string, now: number): void {
    this.db
      .prepare(`UPDATE knowledge_bases SET updated_at = ? WHERE id = ?`)
      .run(now, baseId);
  }

  /** 列出某库下全部块（含向量），用于暴力检索 */
  listChunksWithEmbeddingsForBase(baseId: string): {
    chunkId: string;
    entryId: string;
    chunkIndex: number;
    text: string;
    charStart: number;
    charEnd: number;
    embedding: Float32Array;
  }[] {
    const rows = this.db
      .prepare(
        `SELECT c.id AS chunkId, c.entry_id AS entryId, c.chunk_index AS chunkIndex,
                c.text AS text, c.char_start AS charStart, c.char_end AS charEnd, c.embedding AS embedding
         FROM knowledge_chunks c
         INNER JOIN knowledge_entries e ON e.id = c.entry_id
         WHERE e.base_id = ?`
      )
      .all(baseId) as {
      chunkId: string;
      entryId: string;
      chunkIndex: number;
      text: string;
      charStart: number;
      charEnd: number;
      embedding: Buffer;
    }[];
    return rows.map((r) => ({
      chunkId: r.chunkId,
      entryId: r.entryId,
      chunkIndex: r.chunkIndex,
      text: r.text,
      charStart: r.charStart,
      charEnd: r.charEnd,
      embedding: bufferToFloat32Array(Buffer.from(r.embedding)),
    }));
  }

  /** 按 entryId 集合列出块（含向量），用于意图路由的多文档聚合检索。 */
  listChunksWithEmbeddingsForEntries(entryIds: string[]): {
    chunkId: string;
    entryId: string;
    chunkIndex: number;
    text: string;
    charStart: number;
    charEnd: number;
    embedding: Float32Array;
  }[] {
    if (entryIds.length === 0) return [];
    const placeholders = entryIds.map(() => "?").join(", ");
    const rows = this.db
      .prepare(
        `SELECT c.id AS chunkId, c.entry_id AS entryId, c.chunk_index AS chunkIndex,
                c.text AS text, c.char_start AS charStart, c.char_end AS charEnd, c.embedding AS embedding
         FROM knowledge_chunks c
         INNER JOIN knowledge_entries e ON e.id = c.entry_id
         WHERE c.entry_id IN (${placeholders})
           AND e.index_status = 'ready'`
      )
      .all(...entryIds) as {
      chunkId: string;
      entryId: string;
      chunkIndex: number;
      text: string;
      charStart: number;
      charEnd: number;
      embedding: Buffer;
    }[];
    return rows.map((r) => ({
      chunkId: r.chunkId,
      entryId: r.entryId,
      chunkIndex: r.chunkIndex,
      text: r.text,
      charStart: r.charStart,
      charEnd: r.charEnd,
      embedding: bufferToFloat32Array(Buffer.from(r.embedding)),
    }));
  }
}

const globalForKb = globalThis as unknown as {
  __homeKnowledgeStore?: KnowledgeSqliteStore;
};

/** 进程单例，避免 better-sqlite3 对同一文件重复打开；Next 开发模式热重载仍挂在 globalThis。 */
export function getKnowledgeStore(): KnowledgeSqliteStore {
  if (globalForKb.__homeKnowledgeStore) {
    return globalForKb.__homeKnowledgeStore;
  }
  const store = new KnowledgeSqliteStore(getKnowledgeSqlitePath());
  globalForKb.__homeKnowledgeStore = store;
  return store;
}

/** V1 全量载入内存后点积排序；数据量大时可替换为向量索引或专用库。 */
export function searchChunksInBase(
  store: KnowledgeSqliteStore,
  baseId: string,
  queryVector: number[],
  topK: number
): SearchHit[] {
  const rows = store.listChunksWithEmbeddingsForBase(baseId);
  if (rows.length === 0) return [];
  const scored = rows.map((r) => {
    const vec = Array.from(r.embedding);
    const score = dot(queryVector, vec);
    return {
      chunkId: r.chunkId,
      entryId: r.entryId,
      chunkIndex: r.chunkIndex,
      text: r.text,
      charStart: r.charStart,
      charEnd: r.charEnd,
      score,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(1, topK));
}

/** 与 searchChunksInBase 相同评分策略，但作用域是 entryId 白名单。 */
export function searchChunksInEntries(
  store: KnowledgeSqliteStore,
  entryIds: string[],
  queryVector: number[],
  topK: number
): SearchHit[] {
  const rows = store.listChunksWithEmbeddingsForEntries(entryIds);
  if (rows.length === 0) return [];
  const scored = rows.map((r) => {
    const vec = Array.from(r.embedding);
    const score = dot(queryVector, vec);
    return {
      chunkId: r.chunkId,
      entryId: r.entryId,
      chunkIndex: r.chunkIndex,
      text: r.text,
      charStart: r.charStart,
      charEnd: r.charEnd,
      score,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(1, topK));
}

export { numberArrayToFloat32Buffer };
