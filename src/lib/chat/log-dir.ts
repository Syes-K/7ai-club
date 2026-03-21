import path from "node:path";

/** 聊天 JSONL 日志根目录：`<cwd>/.logs`（不放在 `.next` 下，避免构建清理时丢失） */
export function chatLogRootDir() {
  return path.join(process.cwd(), ".logs");
}
