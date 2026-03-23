import {
  getKnowledgeStore,
  updateEntryBodyAndIndex,
  validateEntryBody,
} from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ baseId: string; entryId: string }> };

/**
 * 仅更新条目正文，并触发向量化重索引。
 * API 路径：`/api/console/knowledge/[baseId]/entries/[entryId]/body`
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { baseId, entryId } = await ctx.params;
  const store = getKnowledgeStore();

  const entry = store.getEntry(entryId);
  if (!entry || entry.baseId !== baseId) {
    return Response.json({ error: "条目不存在" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }

  const body = json as { body?: unknown };
  if (typeof body.body !== "string") {
    return Response.json({ error: "缺少 body" }, { status: 400 });
  }

  const b = validateEntryBody(body.body);
  if (!b.ok) {
    return Response.json({ error: b.error }, { status: 400 });
  }

  const next = await updateEntryBodyAndIndex(entryId, b.body);
  if (!next) {
    return Response.json({ error: "条目不存在" }, { status: 404 });
  }

  return Response.json({ entry: next });
}

