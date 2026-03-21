import { chatLogRepository, type ChatLogQuery } from "@/lib/logs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseIsoMs(v: string | null): number | null {
  if (!v?.trim()) return null;
  const t = Date.parse(v.trim());
  if (!Number.isFinite(t)) return null;
  return t;
}

function defaultRangeMs(): { startMs: number; endMs: number } {
  const endMs = Date.now();
  return { startMs: endMs - 60 * 60 * 1000, endMs };
}

/**
 * GET /api/console/logs
 * 查询聊天落盘日志（JSONL）。访问控制由部署侧限制 /console 暴露面；本接口不做独立密钥门禁。
 *
 * Query:
 * - start, end: ISO8601，闭区间；均可缺省，缺省时为「当前时刻往前 1 小时」
 * - level: 可重复；不传或空表示不限；可传 __UNSET__ 表示仅未标注 level
 * - event: 可重复，条间 OR
 * - requestId: 前缀匹配
 * - keyword: 不区分大小写，对整行 JSON 字符串子串匹配
 * - page: 默认 1
 * - pageSize: 默认 20，最大 100
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  let startMs = parseIsoMs(sp.get("start"));
  let endMs = parseIsoMs(sp.get("end"));
  if (startMs === null && endMs === null) {
    const d = defaultRangeMs();
    startMs = d.startMs;
    endMs = d.endMs;
  } else if (startMs === null || endMs === null) {
    return Response.json(
      { error: "start 与 end 须同时提供或同时省略", code: "LOG_QUERY_RANGE" },
      { status: 400 }
    );
  }

  if (endMs < startMs) {
    return Response.json(
      { error: "结束时间不能早于开始时间", code: "LOG_QUERY_RANGE" },
      { status: 400 }
    );
  }

  const levels = sp.getAll("level").map((s) => s.trim()).filter(Boolean);
  const events = sp.getAll("event").map((s) => s.trim()).filter(Boolean);
  const requestIdPrefix = sp.get("requestId")?.trim() ?? "";
  const keyword = sp.get("keyword")?.trim() ?? "";

  let page = Number(sp.get("page") ?? "1");
  let pageSize = Number(sp.get("pageSize") ?? "20");
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(pageSize)) pageSize = 20;
  pageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));
  page = Math.floor(page);

  const q: ChatLogQuery = {
    startMs,
    endMs,
    levels,
    events,
    requestIdPrefix,
    keyword,
    page,
    pageSize,
  };

  try {
    const result = await chatLogRepository.query(q);
    return Response.json(result);
  } catch {
    return Response.json(
      { error: "暂时无法读取日志", code: "LOG_READ_FAILED" },
      { status: 500 }
    );
  }
}
