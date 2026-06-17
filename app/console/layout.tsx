import { redirect } from "next/navigation";
import { ConsoleShell } from "@/components/console/console-shell";
import { getUserProfile } from "@/lib/console/profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/console/profile");
  }

  const profile = await getUserProfile(user.id).catch(() => null);

  return (
    <ConsoleShell user={user} nickname={profile?.nickname}>
      {children}
    </ConsoleShell>
  );
}
