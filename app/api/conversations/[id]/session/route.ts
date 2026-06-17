import { NextResponse } from "next/server";
import {
  getAssistantForConversation,
  getConversationForUser,
  loadMessages,
} from "@/lib/chat/conversations";
import { getUserProfile } from "@/lib/console/profile";
import { getLlmDisplayLabel } from "@/lib/llm/provider";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const { id: conversationId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await getConversationForUser(conversationId, user.id);
  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const [messages, assistant, profile] = await Promise.all([
      loadMessages(conversationId),
      getAssistantForConversation(conversationId),
      getUserProfile(user.id).catch(() => null),
    ]);

    return NextResponse.json({
      conversationId,
      messages,
      assistantName: assistant.name,
      assistantIcon: assistant.icon,
      modelLabel: getLlmDisplayLabel(assistant.model, profile?.preferred_model),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load" },
      { status: 500 },
    );
  }
}
