import { chatLogRepository, type ChatLogQuery } from "@/lib/logs";
import { resolveLogQueryTimeRange } from "@/lib/logs/log-query-range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/console/logs
 * 查询聊天落盘日志（JSONL）。访问控制由部署侧限制 /console 暴露面；本接口不做独立密钥门禁。
 *
 * Query:
 * - 时间窗（二选一，与 `src/lib/logs/log-query-range.ts` 一致）：
 *   - `start` + `end`：ISO8601，闭区间；成对省略时用默认「当前时刻往前 1 小时」
 *   - `date`（YYYY-MM-DD）+ 可选 `hour`（0～23）：不传 `hour` 表示该本地日历日全天；与 `start`/`end` 互斥
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

  const range = resolveLogQueryTimeRange(sp);
  if (!range.ok) {
    return range.response;
  }
  const { startMs, endMs } = range;

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
