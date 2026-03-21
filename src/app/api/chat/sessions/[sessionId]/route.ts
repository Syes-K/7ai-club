import { getChatStore } from "@/lib/chat/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ sessionId: string }> };

/**
 * 删除整个会话及其消息（SQLite 外键 ON DELETE CASCADE）。
 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { sessionId } = await ctx.params;
  const store = getChatStore();
  const removed = store.deleteSession(sessionId);
  if (!removed) {
    return Response.json({ error: "会话不存在" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
