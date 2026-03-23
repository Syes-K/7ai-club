import {
  createEntryAndIndex,
  getKnowledgeStore,
  validateEntryBody,
  validateEntryTitle,
} from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ baseId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { baseId } = await ctx.params;
  const store = getKnowledgeStore();
  if (!store.getBase(baseId)) {
    return Response.json({ error: "知识库不存在" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }
  const body = json as { title?: unknown; body?: unknown };
  if (typeof body.body !== "string") {
    return Response.json({ error: "缺少 body" }, { status: 400 });
  }

  const t = validateEntryTitle(
    body.title === undefined || body.title === null
      ? null
      : String(body.title)
  );
  if (!t.ok) {
    return Response.json({ error: t.error }, { status: 400 });
  }
  const b = validateEntryBody(body.body);
  if (!b.ok) {
    return Response.json({ error: b.error }, { status: 400 });
  }

  const entry = await createEntryAndIndex(baseId, t.title, b.body);
  return Response.json({ entry });
}
