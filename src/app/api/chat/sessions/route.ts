import { getChatStore } from "@/lib/chat/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = getChatStore();
  const sessions = store.listSessions();
  return Response.json({ sessions });
}

export async function POST() {
  const store = getChatStore();
  const { id } = store.createSession();
  return Response.json({ id }, { status: 201 });
}
