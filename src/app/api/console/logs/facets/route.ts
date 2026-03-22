import { chatLogRepository } from "@/lib/logs";
import { resolveLogQueryTimeRange } from "@/lib/logs/log-query-range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/console/logs/facets
 * 在时间与扫描上限内汇总出现过的 level / event 取值（供筛选 UI）。
 * 时间窗与 `GET /api/console/logs` 相同（`start`/`end` 或 `date`/`hour`）。
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const range = resolveLogQueryTimeRange(sp);
  if (!range.ok) {
    return range.response;
  }
  const { startMs, endMs } = range;

  try {
    const facets = await chatLogRepository.facets({ startMs, endMs });
    return Response.json(facets);
  } catch {
    return Response.json(
      { error: "暂时无法读取日志", code: "LOG_READ_FAILED" },
      { status: 500 }
    );
  }
}
