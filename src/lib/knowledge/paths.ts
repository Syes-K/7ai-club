import path from "node:path";

/** 与 `getChatStore()` 使用同一 SQLite 文件，知识库表与聊天表共存。 */
export function getKnowledgeSqlitePath(): string {
  return (
    process.env.CHAT_SQLITE_PATH?.trim() ||
    path.join(process.cwd(), "data", "chat.sqlite")
  );
}
