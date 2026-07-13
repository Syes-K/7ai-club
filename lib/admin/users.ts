import { isUserBannedFromRecord } from "@/lib/auth/ban";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminUserStatus = "Active" | "Disabled" | "Unconfirmed";

export type AdminUserRow = {
  id: string;
  email: string;
  nickname: string | null;
  status: AdminUserStatus;
  registeredAt: string;
  lastSignInAt: string | null;
  assistantCount: number;
  conversationCount: number;
};

export function deriveAdminUserStatus(user: {
  ban_duration?: string | null;
  banned_until?: string | null;
  email_confirmed_at?: string | null;
}): AdminUserStatus {
  if (isUserBannedFromRecord(user)) {
    return "Disabled";
  }
  if (!user.email_confirmed_at) {
    return "Unconfirmed";
  }
  return "Active";
}

export async function listAdminUsers(options: {
  page: number;
  perPage: number;
  q?: string;
}): Promise<{ users: AdminUserRow[]; total: number }> {
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.listUsers({
    page: options.page,
    perPage: options.perPage,
  });

  if (error) {
    throw new Error(error.message);
  }

  const authUsers = data.users ?? [];
  const ids = authUsers.map((user) => user.id);

  const profilesById = new Map<string, string | null>();
  if (ids.length > 0) {
    const { data: profiles } = await service
      .from("user_profiles")
      .select("user_id, nickname")
      .in("user_id", ids);
    for (const profile of profiles ?? []) {
      profilesById.set(profile.user_id, profile.nickname);
    }
  }

  const assistantCounts = new Map<string, number>();
  const conversationCounts = new Map<string, number>();

  await Promise.all(
    ids.map(async (userId) => {
      const [assistants, conversations] = await Promise.all([
        service
          .from("assistants")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        service
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);
      assistantCounts.set(userId, assistants.count ?? 0);
      conversationCounts.set(userId, conversations.count ?? 0);
    }),
  );

  const q = options.q?.trim().toLowerCase();
  let users: AdminUserRow[] = authUsers.map((user) => ({
    id: user.id,
    email: user.email ?? "",
    nickname: profilesById.get(user.id) ?? null,
    status: deriveAdminUserStatus(user),
    registeredAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    assistantCount: assistantCounts.get(user.id) ?? 0,
    conversationCount: conversationCounts.get(user.id) ?? 0,
  }));

  if (q) {
    users = users.filter(
      (user) =>
        user.email.toLowerCase().includes(q) ||
        (user.nickname?.toLowerCase().includes(q) ?? false),
    );
  }

  return {
    users,
    total: q ? users.length : data.total ?? users.length,
  };
}

export async function disableAdminUser(userId: string): Promise<void> {
  const service = createServiceClient();
  const { error } = await service.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function enableAdminUser(userId: string): Promise<void> {
  const service = createServiceClient();
  const { error } = await service.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (error) {
    throw new Error(error.message);
  }
}
