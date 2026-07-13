export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { ChatAppShell } from "@/components/chat/chat-app-shell";
import { isAdminEmail } from "@/lib/admin/auth";
import { ensureUserProfileDefaults } from "@/lib/console/profile";
import { resolveUserModelForChat } from "@/lib/llm/resolve-user-model";
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

  const profile = await ensureUserProfileDefaults(user.id, supabase).catch(
    () => null,
  );
  const resolved = await resolveUserModelForChat(
    user.id,
    profile?.preferred_model_config_id ?? null,
  ).catch(() => null);

  return (
    <ChatAppShell
      user={user}
      nickname={profile?.nickname}
      preferredModelLabel={resolved?.label ?? "No model configured"}
      showAdminLink={isAdminEmail(user.email)}
    >
      {children}
    </ChatAppShell>
  );
}
