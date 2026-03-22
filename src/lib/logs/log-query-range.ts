/**
 * 解析日志查询时间窗：支持 ISO `start`/`end`，或管理端「日历日 + 可选小时」`date`/`hour`。
 * `date`/`hour` 按 Node 进程所在**本地时区**解释，与按小时切分的落盘文件名一致。
 */

const RANGE_CODE = "LOG_QUERY_RANGE" as const;

function rangeError(message: string): {
  ok: false;
  response: Response;
} {
  return {
    ok: false,
    response: Response.json(
      { error: message, code: RANGE_CODE },
      { status: 400 }
    ),
  };
}

function parseIsoMs(v: string | null): number | null {
  if (!v?.trim()) return null;
  const t = Date.parse(v.trim());
  return Number.isFinite(t) ? t : null;
}

function defaultRangeMs(): { startMs: number; endMs: number } {
  const endMs = Date.now();
  return { startMs: endMs - 60 * 60 * 1000, endMs };
}

function parseLocalDateDay(dateStr: string): {
  y: number;
  mo: number;
  d: number;
} | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return null;
  }
  return { y, mo, d };
}

/**
 * 从 query 解析闭区间 [startMs, endMs]。
 *
 * - **均未提供** `date`、`start`、`end`：默认「当前时刻往前 1 小时」。
 * - **仅** `date`（`YYYY-MM-DD`）+ 可选 `hour`（`0`～`23`）：不传 `hour` 或空串表示该**本地日历日**全天；传 `hour` 表示该本地整点小时。
 * - **`start` + `end`**（ISO 8601，成对）：与 `date`/`hour` **互斥**。
 */
export function resolveLogQueryTimeRange(sp: URLSearchParams):
  | { ok: true; startMs: number; endMs: number }
  | { ok: false; response: Response } {
  const dateRaw = sp.get("date")?.trim() ?? "";
  const hourRaw = sp.get("hour");
  const startRaw = sp.get("start");
  const endRaw = sp.get("end");

  const hasDate = dateRaw.length > 0;
  const hasStart = startRaw != null && startRaw.trim() !== "";
  const hasEnd = endRaw != null && endRaw.trim() !== "";
  const hasHour = hourRaw !== null && hourRaw.trim() !== "";

  if (hasHour && !hasDate) {
    return rangeError("hour 须与 date 同时使用");
  }

  if (hasDate && (hasStart || hasEnd)) {
    return rangeError("date 与 start/end 不能同时使用");
  }

  if (hasDate) {
    const parts = parseLocalDateDay(dateRaw);
    if (!parts) {
      return rangeError("date 须为 YYYY-MM-DD");
    }
    const { y, mo, d } = parts;

    let hour: number | null = null;
    if (hasHour) {
      const h = Number(String(hourRaw).trim());
      if (!Number.isInteger(h) || h < 0 || h > 23) {
        return rangeError("hour 须为 0～23 的整数");
      }
      hour = h;
    }

    let start: Date;
    let end: Date;
    if (hour === null) {
      start = new Date(y, mo, d, 0, 0, 0, 0);
      end = new Date(y, mo, d, 23, 59, 59, 999);
    } else {
      start = new Date(y, mo, d, hour, 0, 0, 0);
      end = new Date(y, mo, d, hour, 59, 59, 999);
    }

    const startMs = start.getTime();
    const endMs = end.getTime();
    if (endMs < startMs) {
      return rangeError("结束时间不能早于开始时间");
    }
    return { ok: true, startMs, endMs };
  }

  if (hasStart || hasEnd) {
    if (!hasStart || !hasEnd) {
      return rangeError("start 与 end 须同时提供或同时省略");
    }
    const startMs = parseIsoMs(startRaw);
    const endMs = parseIsoMs(endRaw);
    if (startMs === null || endMs === null) {
      return rangeError("start 或 end 不是有效的 ISO 8601 时间");
    }
    if (endMs < startMs) {
      return rangeError("结束时间不能早于开始时间");
    }
    return { ok: true, startMs, endMs };
  }

  const d = defaultRangeMs();
  return { ok: true, startMs: d.startMs, endMs: d.endMs };
}
