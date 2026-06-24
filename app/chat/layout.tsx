export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { ChatAppShell } from "@/components/chat/chat-app-shell";
import {
  formatModelConfigLabel,
  PLATFORM_DEFAULT_MODEL_NAME,
  PLATFORM_DEFAULT_PROVIDER,
} from "@/lib/constants/model-providers";
import { getUserProfile } from "@/lib/console/profile";
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

  const profile = await getUserProfile(user.id).catch(() => null);
  const resolved = await resolveUserModelForChat(
    user.id,
    profile?.preferred_model_config_id ?? null,
  ).catch(() => null);

  return (
    <ChatAppShell
      user={user}
      nickname={profile?.nickname}
      preferredModelLabel={
        resolved?.label ??
        formatModelConfigLabel(PLATFORM_DEFAULT_PROVIDER, PLATFORM_DEFAULT_MODEL_NAME)
      }
    >
      {children}
    </ChatAppShell>
  );
}
