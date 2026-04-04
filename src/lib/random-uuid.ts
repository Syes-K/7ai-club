import { v4 as uuidv4 } from "uuid";

/**
 * 统一使用 `uuid` 的 **v4**（RFC 4122），在 Node 与浏览器中行为一致，
 * 不依赖 `crypto.randomUUID`（避免 HTTP 等非安全上下文下缺失）。
 */
export function randomUUID(): string {
  return uuidv4();
}
