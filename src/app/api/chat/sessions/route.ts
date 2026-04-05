import { getChatStore } from "@/lib/chat/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const store = getChatStore();
  const sessions = store.listSessions();
  return Response.json({ sessions });
}

export async function POST(req: Request) {
  const store = getChatStore();
  let assistantId: string | undefined;
  try {
    const text = await req.text();
    if (text.trim()) {
      const json = JSON.parse(text) as { assistantId?: unknown };
      if (typeof json.assistantId === "string" && json.assistantId.trim()) {
        assistantId = json.assistantId.trim();
      }
    }
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }
  try {
    const { id } = store.createSession(
      assistantId !== undefined ? { assistantId } : undefined
    );
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && e.message === "ASSISTANT_NOT_FOUND") {
      return Response.json({ error: "助手不存在" }, { status: 400 });
    }
    throw e;
  }
}
