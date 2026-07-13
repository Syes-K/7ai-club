import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { isAdminEmail } from "@/lib/admin/auth";
import { getUserProfile } from "@/lib/console/profile";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/users");
  }

  if (!isAdminEmail(user.email)) {
    redirect("/forbidden");
  }

  const profile = await getUserProfile(user.id).catch(() => null);

  return (
    <AdminShell user={user} nickname={profile?.nickname} showAdminLink>
      {children}
    </AdminShell>
  );
}
