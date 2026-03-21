import {
  readAppConfigWithMeta,
  validateAppConfigForSave,
  writeAppConfigAtomic,
} from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { config, warning } = readAppConfigWithMeta();
  return Response.json({ config, warning });
}

export async function PUT(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }

  const v = validateAppConfigForSave(json);
  if (!v.ok) {
    return Response.json({ error: v.error }, { status: 400 });
  }

  try {
    writeAppConfigAtomic(v.config);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "写入失败";
    return Response.json({ error: msg }, { status: 500 });
  }

  return Response.json({ ok: true });
}
