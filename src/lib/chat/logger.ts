import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { getAppConfig } from "@/lib/config";

type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getHourFileName(date: Date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());
  return `${y}-${m}-${d}-${h}.log`;
}

function serializeError(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  return value;
}

function normalizePayload(payload: LogPayload): LogPayload {
  const normalized: LogPayload = {};
  for (const [k, v] of Object.entries(payload)) {
    normalized[k] = serializeError(v);
  }
  return normalized;
}

async function appendLogLine(line: string) {
  const logsDir = path.join(process.cwd(), ".next", "logs");
  await mkdir(logsDir, { recursive: true });
  const fileName = getHourFileName(new Date());
  const filePath = path.join(logsDir, fileName);
  await appendFile(filePath, line, "utf8");
}

export async function logChat(
  level: LogLevel,
  event: string,
  payload: LogPayload
) {
  if (!getAppConfig().chatLoggingEnabled) {
    return;
  }

  const now = new Date();
  const line =
    JSON.stringify({
      ts: now.toISOString(),
      level,
      event,
      ...normalizePayload(payload),
    }) + "\n";

  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  fn(`[chat] ${event}`, payload);

  try {
    await appendLogLine(line);
  } catch (e) {
    if (getAppConfig().chatLoggingEnabled) {
      console.error("[chat] log_write_failed", serializeError(e));
    }
  }
}
