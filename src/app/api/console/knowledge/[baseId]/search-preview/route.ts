import { getKnowledgeStore, searchKnowledgeBase } from "@/lib/knowledge";

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
  const body = json as { query?: unknown; topK?: unknown };
  if (typeof body.query !== "string") {
    return Response.json({ error: "缺少 query" }, { status: 400 });
  }
  let topK = 5;
  if (body.topK !== undefined) {
    const n = Number(body.topK);
    if (!Number.isFinite(n) || n < 1 || n > 20) {
      return Response.json({ error: "topK 须为 1～20" }, { status: 400 });
    }
    topK = Math.floor(n);
  }

  try {
    const hits = await searchKnowledgeBase(baseId, body.query, topK);
    return Response.json({ hits });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 502 });
  }
}
