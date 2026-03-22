import path from "path";
import { SqliteChatStore } from "./sqlite-store";
import type { ChatStore } from "./port";

const globalForStore = globalThis as unknown as {
  __homeChatStore?: SqliteChatStore;
};

/**
 * 进程内单例，避免 Next dev 热重载重复打开 DB。
 * 测试或换库时可改为注入自定义 ChatStore 实现。
 */
export function getChatStore(): ChatStore {
  if (globalForStore.__homeChatStore) {
    return globalForStore.__homeChatStore;
  }
  const dbPath =
    process.env.CHAT_SQLITE_PATH?.trim() ||
    path.join(process.cwd(), "data", "chat.sqlite");
  const store = new SqliteChatStore(dbPath);
  globalForStore.__homeChatStore = store;
  return store;
}

export type { ChatStore, SessionSummary, StoredMessage } from "./port";
export { storedToChatMessages } from "./port";
export { SqliteChatStore } from "./sqlite-store";
