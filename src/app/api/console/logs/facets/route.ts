import { chatLogRepository } from "@/lib/logs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseIsoMs(v: string | null): number | null {
  if (!v?.trim()) return null;
  const t = Date.parse(v.trim());
  return Number.isFinite(t) ? t : null;
}

function defaultRangeMs(): { startMs: number; endMs: number } {
  const endMs = Date.now();
  return { startMs: endMs - 60 * 60 * 1000, endMs };
}

/**
 * GET /api/console/logs/facets
 * 在时间与扫描上限内汇总出现过的 level / event 取值（供筛选 UI）。
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
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
