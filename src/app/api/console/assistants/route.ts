import { getChatStore } from "@/lib/chat/store";
import { validateAssistantInput } from "@/lib/assistants/validate";
import type { AssistantRow } from "@/lib/assistants/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assistantToJson(a: AssistantRow) {
  return {
    id: a.id,
    name: a.name,
    prompt: a.prompt,
    iconEmoji: a.iconEmoji,
    knowledgeBaseIds: a.knowledgeBaseIds,
    openingMessage: a.openingMessage,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export async function GET() {
  const store = getChatStore();
  return Response.json({ assistants: store.listAssistants() });
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "无效 JSON" }, { status: 400 });
  }
  const v = validateAssistantInput(json);
  if (!v.ok) {
    return Response.json({ error: v.error }, { status: 400 });
  }
  const store = getChatStore();
  const { id } = store.createAssistantRow(v.data);
  const row = store.getAssistant(id);
  if (!row) {
    return Response.json({ error: "创建失败" }, { status: 500 });
  }
  return Response.json({ assistant: assistantToJson(row) }, { status: 201 });
}
