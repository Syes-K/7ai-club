import { getKnowledgeStore, reindexEntry } from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ baseId: string; entryId: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { baseId, entryId } = await ctx.params;
  const store = getKnowledgeStore();
  const entry = store.getEntry(entryId);
  if (!entry || entry.baseId !== baseId) {
    return Response.json({ error: "条目不存在" }, { status: 404 });
  }
  await reindexEntry(entryId);
  const updated = store.getEntry(entryId);
  return Response.json({ entry: updated });
}
