export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { ChatAppShell } from "@/components/chat/chat-app-shell";
import { getUserProfile } from "@/lib/console/profile";
import { createClient } from "@/lib/supabase/server";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/chat");
  }

  const profile = await getUserProfile(user.id).catch(() => null);

  // preferredModel is passed once from layout — not re-fetched on each chat switch.
  return (
    <ChatAppShell
      user={user}
      nickname={profile?.nickname}
      preferredModel={profile?.preferred_model ?? null}
    >
      {children}
    </ChatAppShell>
  );
}
