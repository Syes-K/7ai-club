import {
  getKnowledgeStore,
  updateEntryMetaOnly,
  validateEntryTitle,
} from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ baseId: string; entryId: string }> };

/**
 * 仅更新文档元信息（标题），不触发向量重建。
 * API 路径：`/api/console/knowledge/[baseId]/entries/[entryId]/meta`
 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { baseId, entryId } = await ctx.params;
  const store = getKnowledgeStore();

  const entry = store.getEntry(entryId);
  if (!entry || entry.baseId !== baseId) {
    return Response.json({ error: "文档不存在" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }

  const body = json as { title?: unknown };
  if (body.title === undefined) {
    return Response.json({ error: "无更新字段" }, { status: 400 });
  }

  const t = validateEntryTitle(
    body.title === null ? null : String(body.title)
  );
  if (!t.ok) {
    return Response.json({ error: t.error }, { status: 400 });
  }

  const next = await updateEntryMetaOnly(entryId, { title: t.title });
  if (!next) {
    return Response.json({ error: "文档不存在" }, { status: 404 });
  }

  return Response.json({ entry: next });
}

