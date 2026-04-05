import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import type {
  AssistantInput,
  AssistantListItem,
  AssistantPublicItem,
  AssistantRow,
} from "@/lib/assistants/types";
import type { ChatStore, SessionSummary, StoredMessage } from "./port";

function columnExists(
  db: import("better-sqlite3").Database,
  table: string,
  name: string
): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.some((r) => r.name === name);
}

function parseJsonStringArray(s: string | null): string[] {
  if (!s?.trim()) return [];
  try {
    const v = JSON.parse(s) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function rowToAssistantRow(r: {
  id: string;
  name: string;
  prompt: string;
  icon_emoji: string | null;
  knowledge_base_ids_json: string;
  opening_message: string | null;
  created_at: number;
  updated_at: number;
}): AssistantRow {
  return {
    id: r.id,
    name: r.name,
    prompt: r.prompt,
    iconEmoji: r.icon_emoji,
    knowledgeBaseIds: parseJsonStringArray(r.knowledge_base_ids_json),
    openingMessage: (r.opening_message ?? "").trim(),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
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

  db.exec(`
    CREATE TABLE IF NOT EXISTS assistants (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      prompt TEXT NOT NULL,
      icon_emoji TEXT,
      knowledge_base_ids_json TEXT NOT NULL DEFAULT '[]',
      quick_phrases_json TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  if (!columnExists(db, "chat_sessions", "assistant_id")) {
    db.exec(`ALTER TABLE chat_sessions ADD COLUMN assistant_id TEXT`);
  }
  if (!columnExists(db, "chat_sessions", "assistant_name_snapshot")) {
    db.exec(`ALTER TABLE chat_sessions ADD COLUMN assistant_name_snapshot TEXT`);
  }
  if (!columnExists(db, "chat_sessions", "assistant_icon_snapshot")) {
    db.exec(`ALTER TABLE chat_sessions ADD COLUMN assistant_icon_snapshot TEXT`);
  }
  if (!columnExists(db, "chat_sessions", "assistant_prompt_snapshot")) {
    db.exec(`ALTER TABLE chat_sessions ADD COLUMN assistant_prompt_snapshot TEXT`);
  }

  if (!columnExists(db, "assistants", "opening_message")) {
    db.exec(
      `ALTER TABLE assistants ADD COLUMN opening_message TEXT NOT NULL DEFAULT ''`
    );
    const legacy = db
      .prepare(
        `SELECT id, quick_phrases_json, opening_message FROM assistants`
      )
      .all() as {
      id: string;
      quick_phrases_json: string;
      opening_message: string;
    }[];
    const upd = db.prepare(
      `UPDATE assistants SET opening_message = ? WHERE id = ?`
    );
    for (const row of legacy) {
      if (row.opening_message && row.opening_message.trim()) continue;
      const arr = parseJsonStringArray(row.quick_phrases_json);
      const first = arr.map((s) => s.trim()).find(Boolean) ?? "";
      if (first) upd.run(first, row.id);
    }
  }
}

export class SqliteChatStore implements ChatStore {
  private readonly db: Database.Database;

  constructor(dbFilePath: string) {
    const dir = path.dirname(dbFilePath);
    fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(dbFilePath);
    migrate(this.db);
  }

  /**
   * Next dev 热更新后进程内单例可能仍是旧实例，但磁盘上的迁移脚本已更新；
   * 再次执行 migrate 可补上 `opening_message` 等列，避免 UPDATE 报 no such column。
   */
  private ensureMigrated(): void {
    migrate(this.db);
  }

  listSessions(): SessionSummary[] {
    const rows = this.db
      .prepare(
        `SELECT id, title, updated_at AS updatedAt,
          assistant_id AS assistantId,
          assistant_name_snapshot AS assistantName,
          assistant_icon_snapshot AS assistantIcon
         FROM chat_sessions ORDER BY updated_at DESC`
      )
      .all() as {
      id: string;
      title: string | null;
      updatedAt: number;
      assistantId: string | null;
      assistantName: string | null;
      assistantIcon: string | null;
    }[];
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: r.updatedAt,
      assistantId: r.assistantId,
      assistantName: r.assistantName,
      assistantIcon: r.assistantIcon,
    }));
  }

  createSession(options?: { assistantId?: string | null }): { id: string } {
    const id = crypto.randomUUID();
    const now = Date.now();
    let assistantId: string | null = null;
    let nameSnap: string | null = null;
    let iconSnap: string | null = null;
    let promptSnap: string | null = null;
    const aid = options?.assistantId?.trim();
    if (aid) {
      const row = this.db
        .prepare(
          `SELECT id, name, prompt, icon_emoji FROM assistants WHERE id = ?`
        )
        .get(aid) as
        | { id: string; name: string; prompt: string; icon_emoji: string | null }
        | undefined;
      if (!row) {
        throw new Error("ASSISTANT_NOT_FOUND");
      }
      assistantId = row.id;
      nameSnap = row.name;
      iconSnap = row.icon_emoji;
      promptSnap = row.prompt;
    }
    this.db
      .prepare(
        `INSERT INTO chat_sessions (
          id, created_at, updated_at, title,
          assistant_id, assistant_name_snapshot, assistant_icon_snapshot, assistant_prompt_snapshot
        ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?)`
      )
      .run(id, now, now, assistantId, nameSnap, iconSnap, promptSnap);
    return { id };
  }

  getSessionAssistantPromptSnapshot(sessionId: string): string | null {
    const row = this.db
      .prepare(
        `SELECT assistant_prompt_snapshot FROM chat_sessions WHERE id = ?`
      )
      .get(sessionId) as { assistant_prompt_snapshot: string | null } | undefined;
    return row?.assistant_prompt_snapshot ?? null;
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

  listAssistants(): AssistantListItem[] {
    this.ensureMigrated();
    const rows = this.db
      .prepare(
        `SELECT id, name, icon_emoji, knowledge_base_ids_json, opening_message, updated_at AS updatedAt
         FROM assistants ORDER BY updated_at DESC`
      )
      .all() as {
      id: string;
      name: string;
      icon_emoji: string | null;
      knowledge_base_ids_json: string;
      opening_message: string;
      updatedAt: number;
    }[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      iconEmoji: r.icon_emoji,
      knowledgeBaseIds: parseJsonStringArray(r.knowledge_base_ids_json),
      hasOpeningMessage: Boolean(r.opening_message?.trim()),
      updatedAt: r.updatedAt,
    }));
  }

  listAssistantsPublic(): AssistantPublicItem[] {
    this.ensureMigrated();
    const rows = this.db
      .prepare(
        `SELECT id, name, icon_emoji, opening_message FROM assistants ORDER BY updated_at DESC`
      )
      .all() as {
      id: string;
      name: string;
      icon_emoji: string | null;
      opening_message: string;
    }[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      iconEmoji: r.icon_emoji,
      openingMessage: r.opening_message ?? "",
    }));
  }

  getAssistant(id: string): AssistantRow | null {
    this.ensureMigrated();
    const row = this.db
      .prepare(
        `SELECT id, name, prompt, icon_emoji, knowledge_base_ids_json, opening_message, created_at, updated_at
         FROM assistants WHERE id = ?`
      )
      .get(id) as
      | {
          id: string;
          name: string;
          prompt: string;
          icon_emoji: string | null;
          knowledge_base_ids_json: string;
          opening_message: string | null;
          created_at: number;
          updated_at: number;
        }
      | undefined;
    if (!row) return null;
    return rowToAssistantRow(row);
  }

  createAssistantRow(input: AssistantInput): { id: string } {
    this.ensureMigrated();
    const id = crypto.randomUUID();
    const now = Date.now();
    const kbJson = JSON.stringify(input.knowledgeBaseIds);
    this.db
      .prepare(
        `INSERT INTO assistants (
          id, name, prompt, icon_emoji, knowledge_base_ids_json, quick_phrases_json, opening_message, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, '[]', ?, ?, ?)`
      )
      .run(
        id,
        input.name,
        input.prompt,
        input.iconEmoji ?? null,
        kbJson,
        input.openingMessage ?? "",
        now,
        now
      );
    return { id };
  }

  updateAssistantRow(id: string, input: AssistantInput): boolean {
    this.ensureMigrated();
    const now = Date.now();
    const kbJson = JSON.stringify(input.knowledgeBaseIds);
    const r = this.db
      .prepare(
        `UPDATE assistants SET
          name = ?, prompt = ?, icon_emoji = ?,
          knowledge_base_ids_json = ?, quick_phrases_json = '[]', opening_message = ?, updated_at = ?
         WHERE id = ?`
      )
      .run(
        input.name,
        input.prompt,
        input.iconEmoji ?? null,
        kbJson,
        input.openingMessage ?? "",
        now,
        id
      );
    return r.changes > 0;
  }

  deleteAssistantRow(id: string): boolean {
    this.db
      .prepare(`UPDATE chat_sessions SET assistant_id = NULL WHERE assistant_id = ?`)
      .run(id);
    const r = this.db.prepare(`DELETE FROM assistants WHERE id = ?`).run(id);
    return r.changes > 0;
  }
}
