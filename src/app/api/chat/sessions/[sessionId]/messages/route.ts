import { getChatStore } from "@/lib/chat/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ sessionId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { sessionId } = await ctx.params;
  const store = getChatStore();
  if (!store.sessionExists(sessionId)) {
    return Response.json({ error: "会话不存在" }, { status: 404 });
  }
  const messages = store.listMessages(sessionId);
  return Response.json({ messages });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { sessionId } = await ctx.params;
  const store = getChatStore();
  if (!store.sessionExists(sessionId)) {
    return Response.json({ error: "会话不存在" }, { status: 404 });
  }
  store.clearMessages(sessionId);
  return new Response(null, { status: 204 });
}
