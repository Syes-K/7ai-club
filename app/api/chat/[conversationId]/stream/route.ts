export const runtime = "nodejs";

import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { isRedisConfigured } from "@/lib/redis/client";
import { loadMessages } from "@/lib/chat/conversations";
import { resumeResumableStream } from "@/lib/redis/stream-context";
import { getConversationForUser } from "@/lib/chat/conversations";
import { getActiveRunForConversation } from "@/lib/workflow/persistence";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const conversation = await getConversationForUser(conversationId, user.id);
  if (!conversation) {
    return new Response("Conversation not found", { status: 404 });
  }

  const run = await getActiveRunForConversation(
    supabase,
    conversationId,
    user.id,
  );

  if (!run?.activeStreamId || !isRedisConfigured()) {
    return new Response(null, { status: 204 });
  }

  const messages = await loadMessages(conversationId, supabase);
  const lastMessage = messages.at(-1);
  if (lastMessage?.role === "assistant") {
    return new Response(null, { status: 204 });
  }

  const body = await resumeResumableStream(run.activeStreamId);

  if (!body) {
    return new Response(null, { status: 204 });
  }

  return new Response(body, { headers: UI_MESSAGE_STREAM_HEADERS });
}
