import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type { ChatStore, SessionSummary, StoredMessage } from "./port";

function columnExists(
  db: import("better-sqlite3").Database,
  table: string,
  name: string
): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.some((r) => r.name === name);
}

function migrate(db: import("better-sqlite3").Database) {
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      title TEXT
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(session_id, created_at);
  `);
  if (!columnExists(db, "chat_sessions", "context_summary")) {
    db.exec(`ALTER TABLE chat_sessions ADD COLUMN context_summary TEXT`);
  }
  if (!columnExists(db, "chat_sessions", "summary_message_count_at_refresh")) {
    db.exec(
      `ALTER TABLE chat_sessions ADD COLUMN summary_message_count_at_refresh INTEGER DEFAULT 0`
    );
  }
}

export class SqliteChatStore implements ChatStore {
  private readonly db: Database.Database;

  constructor(dbFilePath: string) {
    const dir = path.dirname(dbFilePath);
    fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(dbFilePath);
    this.db.pragma("journal_mode = WAL");
    migrate(this.db);
  }

  listSessions(): SessionSummary[] {
    const rows = this.db
      .prepare(
        `SELECT id, title, updated_at AS updatedAt FROM chat_sessions ORDER BY updated_at DESC`
      )
      .all() as { id: string; title: string | null; updatedAt: number }[];
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: r.updatedAt,
    }));
  }

  createSession(): { id: string } {
    const id = crypto.randomUUID();
    const now = Date.now();
    this.db
      .prepare(
        `INSERT INTO chat_sessions (id, created_at, updated_at, title) VALUES (?, ?, ?, NULL)`
      )
      .run(id, now, now);
    return { id };
  }

  sessionExists(id: string): boolean {
    const row = this.db
      .prepare(`SELECT 1 AS ok FROM chat_sessions WHERE id = ? LIMIT 1`)
      .get(id) as { ok: number } | undefined;
    return Boolean(row);
  }

  listMessages(sessionId: string): StoredMessage[] {
    const rows = this.db
      .prepare(
        `SELECT id, role, content, created_at AS createdAt FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC`
      )
      .all(sessionId) as StoredMessage[];
    return rows;
  }

  appendMessage(
    sessionId: string,
    role: "user" | "assistant" | "system",
    content: string
  ): { id: string } {
    const id = crypto.randomUUID();
    const now = Date.now();
    this.db
      .prepare(
        `INSERT INTO chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`
      )
      .run(id, sessionId, role, content, now);
    this.db
      .prepare(`UPDATE chat_sessions SET updated_at = ? WHERE id = ?`)
      .run(now, sessionId);
    return { id };
  }

  clearMessages(sessionId: string): void {
    this.db
      .prepare(`DELETE FROM chat_messages WHERE session_id = ?`)
      .run(sessionId);
    const now = Date.now();
    this.db
      .prepare(
        `UPDATE chat_sessions SET updated_at = ?, context_summary = NULL, summary_message_count_at_refresh = 0 WHERE id = ?`
      )
      .run(now, sessionId);
  }

  getSessionContextSummary(sessionId: string): {
    summary: string | null;
    summaryMessageCountAtRefresh: number;
  } {
    const row = this.db
      .prepare(
        `SELECT context_summary AS summary, COALESCE(summary_message_count_at_refresh, 0) AS mc FROM chat_sessions WHERE id = ?`
      )
      .get(sessionId) as { summary: string | null; mc: number } | undefined;
    if (!row) {
      return { summary: null, summaryMessageCountAtRefresh: 0 };
    }
    return {
      summary: row.summary,
      summaryMessageCountAtRefresh: row.mc,
    };
  }

  setSessionContextSummary(
    sessionId: string,
    summary: string | null,
    messageCountAtRefresh: number
  ): void {
    const now = Date.now();
    this.db
      .prepare(
        `UPDATE chat_sessions SET context_summary = ?, summary_message_count_at_refresh = ?, updated_at = ? WHERE id = ?`
      )
      .run(summary, messageCountAtRefresh, now, sessionId);
  }

  deleteSession(sessionId: string): boolean {
    const r = this.db
      .prepare(`DELETE FROM chat_sessions WHERE id = ?`)
      .run(sessionId);
    return r.changes > 0;
  }

  maybeSetTitleFromUserMessage(sessionId: string, userContent: string): void {
    const snippet = userContent.trim().slice(0, 40) || "新对话";
    const now = Date.now();
    this.db
      .prepare(
        `UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ? AND (title IS NULL OR title = '')`
      )
      .run(snippet, now, sessionId);
  }

  touchSession(sessionId: string): void {
    const now = Date.now();
    this.db
      .prepare(`UPDATE chat_sessions SET updated_at = ? WHERE id = ?`)
      .run(now, sessionId);
  }
}
