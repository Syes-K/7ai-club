import { redirect } from "next/navigation";
import { ChatEmptyMain } from "@/components/chat/chat-empty-main";
import { getLatestConversationId } from "@/lib/chat/conversations";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let latestId: string | null = null;
  try {
    latestId = await getLatestConversationId(user.id);
  } catch {
    latestId = null;
  }

  if (latestId) {
    redirect(`/chat/${latestId}`);
  }

  return <ChatEmptyMain />;
}
