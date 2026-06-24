export const runtime = "nodejs";

import { getConversationForUser } from "@/lib/chat/conversations";
import {
  getLatestRunForConversation,
  getStepLogsForRun,
} from "@/lib/workflow/persistence";
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

  const run = await getLatestRunForConversation(
    supabase,
    conversationId,
    user.id,
  );

  if (!run) {
    return Response.json({ run: null, steps: [] });
  }

  const steps = await getStepLogsForRun(supabase, run.id);

  return Response.json({
    run: {
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
    },
    steps,
  });
}
