import {
  executeIntentRoutingOnce,
  getIntentRoutingConfig,
  validateIntentRoutingConfig,
} from "@/lib/intent-routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }
  const body = json as { query?: unknown; intentId?: unknown; config?: unknown };
  if (typeof body.query !== "string" || !body.query.trim()) {
    return Response.json({ error: "query 不能为空" }, { status: 400 });
  }

  let config = getIntentRoutingConfig();
  if (body.config !== undefined) {
    const v = validateIntentRoutingConfig(body.config);
    if (!v.ok) {
      return Response.json({ valid: false, fieldErrors: v.fieldErrors }, { status: 400 });
    }
    config = v.config;
  }

  try {
    const result = await executeIntentRoutingOnce({
      query: body.query,
      intentId: typeof body.intentId === "string" ? body.intentId : undefined,
      config,
    });
    return Response.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "执行失败";
    return Response.json({ error: msg }, { status: 502 });
  }
}
