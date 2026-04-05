import { getKnowledgeStore } from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ entryId: string }> };

/** 公开只读：按文档 id 获取正文（供 /knowledge/preview 与对话侧预览链接）。 */
export async function GET(_req: Request, ctx: Ctx) {
  const { entryId } = await ctx.params;
  const store = getKnowledgeStore();
  const entry = store.getEntry(entryId);
  if (!entry) {
    return Response.json({ error: "文档不存在" }, { status: 404 });
  }
  return Response.json({ entry });
}
