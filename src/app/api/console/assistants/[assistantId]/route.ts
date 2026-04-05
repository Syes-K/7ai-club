import { getChatStore } from "@/lib/chat/store";
import { validateAssistantInput } from "@/lib/assistants/validate";
import type { AssistantRow } from "@/lib/assistants/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ assistantId: string }> };

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

export async function GET(_req: Request, ctx: Ctx) {
  const { assistantId } = await ctx.params;
  const store = getChatStore();
  const row = store.getAssistant(assistantId);
  if (!row) {
    return Response.json({ error: "助手不存在" }, { status: 404 });
  }
  return Response.json({ assistant: assistantToJson(row) });
}

export async function PUT(req: Request, ctx: Ctx) {
  const { assistantId } = await ctx.params;
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
  const ok = store.updateAssistantRow(assistantId, v.data);
  if (!ok) {
    return Response.json({ error: "助手不存在" }, { status: 404 });
  }
  const row = store.getAssistant(assistantId);
  if (!row) {
    return Response.json({ error: "助手不存在" }, { status: 404 });
  }
  return Response.json({ assistant: assistantToJson(row) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { assistantId } = await ctx.params;
  const store = getChatStore();
  const ok = store.deleteAssistantRow(assistantId);
  if (!ok) {
    return Response.json({ error: "助手不存在" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
