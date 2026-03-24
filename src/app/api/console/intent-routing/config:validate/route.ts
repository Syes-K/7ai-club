import { validateIntentRoutingConfig } from "@/lib/intent-routing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }

  const v = validateIntentRoutingConfig(json);
  if (!v.ok) {
    return Response.json({ valid: false, fieldErrors: v.fieldErrors });
  }
  return Response.json({ valid: true, fieldErrors: [] });
}
