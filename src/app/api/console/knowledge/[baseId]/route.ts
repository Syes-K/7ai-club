import Database from "better-sqlite3";
import {
  getKnowledgeStore,
  validateBaseName,
} from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ baseId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { baseId } = await ctx.params;
  const store = getKnowledgeStore();
  const base = store.getBase(baseId);
  if (!base) {
    return Response.json({ error: "知识库不存在" }, { status: 404 });
  }
  const entries = store.listEntries(baseId);
  return Response.json({ base, entries });
}

export async function PATCH(req: Request, ctx: Ctx) {
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
  const body = json as { name?: unknown; description?: unknown };
  if (body.name === undefined && body.description === undefined) {
    return Response.json({ error: "无更新字段" }, { status: 400 });
  }

  if (body.name !== undefined) {
    if (typeof body.name !== "string") {
      return Response.json({ error: "name 类型错误" }, { status: 400 });
    }
    const v = validateBaseName(body.name);
    if (!v.ok) {
      return Response.json({ error: v.error }, { status: 400 });
    }
  }

  const patch: { name?: string; description?: string | null } = {};
  if (body.name !== undefined) {
    patch.name = body.name.trim();
  }
  if (body.description !== undefined) {
    patch.description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : null;
  }

  try {
    store.updateBase(baseId, patch);
  } catch (e) {
    if (e instanceof Database.SqliteError && e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return Response.json({ error: "知识库名称已存在" }, { status: 409 });
    }
    throw e;
  }

  const base = store.getBase(baseId);
  return Response.json({ base });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { baseId } = await ctx.params;
  const store = getKnowledgeStore();
  const ok = store.deleteBase(baseId);
  if (!ok) {
    return Response.json({ error: "知识库不存在" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
