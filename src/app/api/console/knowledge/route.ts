import Database from "better-sqlite3";
import {
  getKnowledgeStore,
  validateBaseName,
} from "@/lib/knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = getKnowledgeStore();
  const bases = store.listBases();
  return Response.json({ bases });
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }
  const body = json as { name?: unknown; description?: unknown };
  if (typeof body.name !== "string") {
    return Response.json({ error: "缺少 name" }, { status: 400 });
  }
  const v = validateBaseName(body.name);
  if (!v.ok) {
    return Response.json({ error: v.error }, { status: 400 });
  }
  const name = body.name.trim();
  const description =
    typeof body.description === "string" ? body.description.trim() || null : null;

  const store = getKnowledgeStore();
  try {
    const base = store.createBase(name, description);
    return Response.json({ base });
  } catch (e) {
    if (e instanceof Database.SqliteError && e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return Response.json({ error: "知识库名称已存在" }, { status: 409 });
    }
    throw e;
  }
}
