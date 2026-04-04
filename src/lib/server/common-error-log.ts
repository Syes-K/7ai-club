import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { chatLogRootDir } from "@/lib/chat/log-dir";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** 本地日历日 YYYY-MM-DD，与 common-error.YYYY-MM-DD.log 文件名一致 */
function formatLocalDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function payloadFromUnknown(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  if (typeof err === "object" && err !== null) {
    try {
      return JSON.parse(JSON.stringify(err)) as Record<string, unknown>;
    } catch {
      return { detail: String(err) };
    }
  }
  return { detail: String(err) };
}

function commonErrorFilePath(date: Date) {
  const dir = chatLogRootDir();
  const name = `common-error.${formatLocalDate(date)}.log`;
  return path.join(dir, name);
}

/**
 * 将 Node 服务层异常写入 `.logs/common-error.YYYY-MM-DD.log`（JSONL）。
 * 使用同步 IO，便于在 `uncaughtException` 等退出前场景尽量落盘。
 */
export function logCommonErrorSync(
  err: unknown,
  meta?: Record<string, unknown>
): void {
  const ts = new Date().toISOString();
  const line = JSON.stringify({
    ts,
    ...payloadFromUnknown(err),
    ...meta,
  });

  try {
    const filePath = commonErrorFilePath(new Date());
    mkdirSync(path.dirname(filePath), { recursive: true });
    appendFileSync(filePath, `${line}\n`, "utf8");
  } catch (e) {
    console.error("[common-error-log] write_failed", e);
  }
}
