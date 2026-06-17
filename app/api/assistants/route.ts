import { NextResponse } from "next/server";
import {
  normalizeAssistantIcon,
  normalizeOpeningMessage,
  serializeAssistant,
  validateAssistantIcon,
  validateOpeningMessage,
} from "@/lib/console/assistant-fields";
import {
  createUserAssistant,
  ensureUserAssistants,
} from "@/lib/console/assistants";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const assistants = await ensureUserAssistants(user.id);
    return NextResponse.json({
      assistants: assistants.map(serializeAssistant),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    systemPrompt?: string;
    icon?: string;
    openingMessage?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 422 });
  }

  const name = body.name?.trim() ?? "";
  const systemPrompt = body.systemPrompt?.trim() ?? "";
  const icon = normalizeAssistantIcon(body.icon);
  const openingMessage = normalizeOpeningMessage(body.openingMessage);

  if (!name || name.length > 64) {
    return NextResponse.json({ error: "Invalid name" }, { status: 422 });
  }

  if (!systemPrompt) {
    return NextResponse.json({ error: "System prompt is required" }, { status: 422 });
  }

  const iconError = validateAssistantIcon(icon);
  if (iconError) {
    return NextResponse.json({ error: iconError }, { status: 422 });
  }

  const openingError = validateOpeningMessage(openingMessage);
  if (openingError) {
    return NextResponse.json({ error: openingError }, { status: 422 });
  }

  try {
    const assistant = await createUserAssistant(user.id, {
      name,
      systemPrompt,
      icon,
      openingMessage,
    });
    return NextResponse.json({ assistant: serializeAssistant(assistant) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create" },
      { status: 500 },
    );
  }
}
