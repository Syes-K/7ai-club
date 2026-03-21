import { createReadStream } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";
import { chatLogRootDir } from "@/lib/chat/log-dir";
import type {
  ChatLogFacets,
  ChatLogQuery,
  ChatLogQueryResult,
  ChatLogRecord,
  ChatLogRepository,
} from "./chat-log-types";
import { UNSET_LEVEL_SENTINEL } from "./chat-log-types";

const LOG_FILE_RE = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})\.log$/;

/** 单次查询最多扫描的行数（跨文件累计），防止超大目录拖垮进程 */
const MAX_SCAN_LINES_QUERY = 200_000;
/** facets 扫描上限略低 */
const MAX_SCAN_LINES_FACETS = 80_000;

function logsDir() {
  return chatLogRootDir();
}

function parseHourFileStartMs(fileName: string): number | null {
  const m = fileName.match(LOG_FILE_RE);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const h = Number(m[4]);
  const local = new Date(y, mo, d, h, 0, 0, 0);
  return local.getTime();
}

/** 日志文件按小时切分（与 logger 一致，使用服务器本地时区的整点） */
function fileHourOverlapsRange(
  fileName: string,
  startMs: number,
  endMs: number
): boolean {
  const fileStart = parseHourFileStartMs(fileName);
  if (fileStart === null) return false;
  const fileEnd = fileStart + 60 * 60 * 1000;
  return fileEnd > startMs && fileStart < endMs;
}

async function listOverlappingLogFiles(
  startMs: number,
  endMs: number
): Promise<string[]> {
  let names: string[];
  try {
    names = await readdir(logsDir());
  } catch {
    return [];
  }
  const paths: string[] = [];
  for (const name of names) {
    if (!LOG_FILE_RE.test(name)) continue;
    if (!fileHourOverlapsRange(name, startMs, endMs)) continue;
    paths.push(path.join(logsDir(), name));
  }
  paths.sort((a, b) => {
    const ba = path.basename(a);
    const bb = path.basename(b);
    return bb.localeCompare(ba);
  });
  return paths;
}

function parseRecordTsMs(rec: ChatLogRecord): number | null {
  const ts = rec.ts;
  if (typeof ts !== "string" || !ts.trim()) return null;
  const ms = Date.parse(ts);
  return Number.isFinite(ms) ? ms : null;
}

function matchesTime(rec: ChatLogRecord, startMs: number, endMs: number): boolean {
  const t = parseRecordTsMs(rec);
  if (t === null) return false;
  return t >= startMs && t <= endMs;
}

function matchesLevels(
  rec: ChatLogRecord,
  levels: string[]
): boolean {
  if (levels.length === 0) return true;
  const raw = rec.level;
  const hasLevel = typeof raw === "string" && raw.length > 0;
  if (!hasLevel) {
    return levels.includes(UNSET_LEVEL_SENTINEL);
  }
  return levels.includes(raw);
}

function matchesEvents(rec: ChatLogRecord, events: string[]): boolean {
  if (events.length === 0) return true;
  const ev = rec.event;
  if (typeof ev !== "string") return false;
  return events.some((e) => e === ev);
}

function matchesRequestId(rec: ChatLogRecord, prefix: string): boolean {
  if (!prefix) return true;
  const id = rec.requestId;
  if (typeof id !== "string") return false;
  return id.startsWith(prefix);
}

function matchesKeyword(rec: ChatLogRecord, keyword: string): boolean {
  if (!keyword) return true;
  const hay = JSON.stringify(rec).toLowerCase();
  return hay.includes(keyword.toLowerCase());
}

async function forEachLogLine(
  filePaths: string[],
  maxLines: number,
  onLine: (line: string) => void
): Promise<{ scannedLines: number; truncated: boolean }> {
  let scanned = 0;
  let truncated = false;
  outer: for (const fp of filePaths) {
    const stream = createReadStream(fp, { encoding: "utf8" });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });
    try {
      for await (const line of rl) {
        if (scanned >= maxLines) {
          truncated = true;
          break outer;
        }
        const trimmed = line.trim();
        if (!trimmed) continue;
        onLine(trimmed);
        scanned += 1;
      }
    } finally {
      rl.close();
      stream.destroy();
    }
  }
  return { scannedLines: scanned, truncated };
}

export function createChatLogFileRepository(): ChatLogRepository {
  return {
    async query(q: ChatLogQuery): Promise<ChatLogQueryResult> {
      const files = await listOverlappingLogFiles(q.startMs, q.endMs);
      const matches: ChatLogRecord[] = [];

      const { scannedLines, truncated } = await forEachLogLine(
        files,
        MAX_SCAN_LINES_QUERY,
        (trimmed) => {
          let rec: ChatLogRecord;
          try {
            rec = JSON.parse(trimmed) as ChatLogRecord;
          } catch {
            return;
          }
          if (!matchesTime(rec, q.startMs, q.endMs)) return;
          if (!matchesLevels(rec, q.levels)) return;
          if (!matchesEvents(rec, q.events)) return;
          if (!matchesRequestId(rec, q.requestIdPrefix)) return;
          if (!matchesKeyword(rec, q.keyword)) return;
          matches.push(rec);
        }
      );

      matches.sort((a, b) => {
        const ta = parseRecordTsMs(a) ?? 0;
        const tb = parseRecordTsMs(b) ?? 0;
        return tb - ta;
      });

      const total = matches.length;
      const page = Math.max(1, q.page);
      const pageSize = Math.min(Math.max(1, q.pageSize), 100);
      const start = (page - 1) * pageSize;
      const items = matches.slice(start, start + pageSize);

      return {
        items,
        total,
        page,
        pageSize,
        scanTruncated: truncated,
        scannedLines,
      };
    },

    async facets(range: {
      startMs: number;
      endMs: number;
    }): Promise<ChatLogFacets> {
      const files = await listOverlappingLogFiles(range.startMs, range.endMs);
      const levelSet = new Set<string>();
      const eventSet = new Set<string>();

      const { scannedLines, truncated } = await forEachLogLine(
        files,
        MAX_SCAN_LINES_FACETS,
        (trimmed) => {
          let rec: ChatLogRecord;
          try {
            rec = JSON.parse(trimmed) as ChatLogRecord;
          } catch {
            return;
          }
          if (!matchesTime(rec, range.startMs, range.endMs)) return;
          const lv = rec.level;
          if (typeof lv === "string" && lv.length > 0) levelSet.add(lv);
          const ev = rec.event;
          if (typeof ev === "string" && ev.length > 0) eventSet.add(ev);
        }
      );

      return {
        levels: [...levelSet].sort(),
        events: [...eventSet].sort(),
        scanTruncated: truncated,
        scannedLines,
      };
    },
  };
}
