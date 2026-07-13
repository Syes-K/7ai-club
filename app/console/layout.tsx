import { redirect } from "next/navigation";
import { ConsoleShell } from "@/components/console/console-shell";
import { isAdminEmail } from "@/lib/admin/auth";
import { ensureUserProfileDefaults } from "@/lib/console/profile";
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

  const profile = await ensureUserProfileDefaults(user.id, supabase).catch(
    () => null,
  );

  return (
    <ConsoleShell
      user={user}
      nickname={profile?.nickname}
      showAdminLink={isAdminEmail(user.email)}
    >
      {children}
    </ConsoleShell>
  );
}
