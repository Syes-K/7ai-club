import { NextResponse } from "next/server";
import {
  parseAssistantFormBody,
  serializeAssistant,
} from "@/lib/console/assistant-fields";
import {
  deleteUserAssistant,
  updateUserAssistant,
} from "@/lib/console/assistants";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 });
  }

  const parsed = parseAssistantFormBody(
    body as Record<string, unknown>,
  );
  if (parsed.error || !parsed.values) {
    return NextResponse.json(
      { error: parsed.error ?? "Invalid request" },
      { status: 422 },
    );
  }

  try {
    const assistant = await updateUserAssistant(user.id, id, {
      name: parsed.values.name,
      systemPrompt: parsed.values.systemPrompt,
      icon: parsed.values.icon,
      openingMessage: parsed.values.openingMessage,
    });
    return NextResponse.json({ assistant: serializeAssistant(assistant) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update" },
      { status: 404 },
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await deleteUserAssistant(user.id, id);

    if (!result.deleted && result.chatCount > 0) {
      return NextResponse.json(
        {
          error: `This assistant is used in ${result.chatCount} chat(s). Delete those chats first.`,
          chatCount: result.chatCount,
        },
        { status: 409 },
      );
    }

    if (!result.deleted) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete" },
      { status: 500 },
    );
  }
}
