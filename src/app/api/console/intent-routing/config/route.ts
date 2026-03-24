import {
  readIntentRoutingConfigWithMeta,
  validateIntentRoutingConfig,
  writeIntentRoutingConfigAtomic,
} from "@/lib/intent-routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { config, warning } = readIntentRoutingConfigWithMeta();
  return Response.json({ config, warning });
}

export async function PUT(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }

  const v = validateIntentRoutingConfig(json);
  if (!v.ok) {
    return Response.json({ valid: false, fieldErrors: v.fieldErrors }, { status: 400 });
  }

  const next = {
    ...v.config,
    updatedAt: new Date().toISOString(),
    version: String(Number(v.config.version || "0") + 1),
  };

  try {
    writeIntentRoutingConfigAtomic(next);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "写入失败";
    return Response.json({ error: msg }, { status: 500 });
  }

  return Response.json({
    ok: true,
    version: next.version,
    updatedAt: next.updatedAt,
    updatedBy: next.updatedBy,
  });
}
