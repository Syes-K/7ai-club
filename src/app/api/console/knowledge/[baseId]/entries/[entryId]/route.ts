import { getKnowledgeStore, updateEntryAndIndex, validateEntryBody, validateEntryTitle } from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ baseId: string; entryId: string }> };

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
  const body = json as { title?: unknown; body?: unknown };
  if (body.title === undefined && body.body === undefined) {
    return Response.json({ error: "无更新字段" }, { status: 400 });
  }

  const patch: { title?: string | null; body?: string } = {};
  if (body.title !== undefined) {
    const t = validateEntryTitle(
      body.title === null ? null : String(body.title)
    );
    if (!t.ok) {
      return Response.json({ error: t.error }, { status: 400 });
    }
    patch.title = t.title;
  }
  if (body.body !== undefined) {
    if (typeof body.body !== "string") {
      return Response.json({ error: "body 类型错误" }, { status: 400 });
    }
    const b = validateEntryBody(body.body);
    if (!b.ok) {
      return Response.json({ error: b.error }, { status: 400 });
    }
    patch.body = b.body;
  }

  const next = await updateEntryAndIndex(entryId, patch);
  return Response.json({ entry: next });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { baseId, entryId } = await ctx.params;
  const store = getKnowledgeStore();
  const entry = store.getEntry(entryId);
  if (!entry || entry.baseId !== baseId) {
    return Response.json({ error: "文档不存在" }, { status: 404 });
  }
  store.deleteEntry(entryId);
  return Response.json({ ok: true });
}
