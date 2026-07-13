import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ACCOUNT_DISABLED_MESSAGE,
  isUserBannedFromRecord,
} from "@/lib/auth/ban";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export class AccountDisabledError extends Error {
  constructor(message = ACCOUNT_DISABLED_MESSAGE) {
    super(message);
    this.name = "AccountDisabledError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function isUserIdBanned(userId: string): Promise<boolean> {
  const service = createServiceClient();
  const { data, error } = await service.auth.admin.getUserById(userId);

  if (error || !data.user) {
    return false;
  }

  return isUserBannedFromRecord(data.user);
}

/** Signs the user out when banned. Throws AccountDisabledError if banned. */
export async function ensureUserNotBanned(
  userId: string,
  supabase: SupabaseClient,
): Promise<void> {
  if (!(await isUserIdBanned(userId))) {
    return;
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // Best-effort cookie cleanup.
  }

  throw new AccountDisabledError();
}

export function isUserAppPath(pathname: string): boolean {
  return (
    pathname.startsWith("/chat") ||
    pathname.startsWith("/console") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/models") ||
    pathname.startsWith("/api/knowledge")
  );
}

export async function requireActiveUser(): Promise<{
  user: User;
  supabase: SupabaseClient;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  await ensureUserNotBanned(user.id, supabase);

  return { user, supabase };
}

export function authGuardResponse(error: unknown): Response | null {
  if (error instanceof UnauthorizedError) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (error instanceof AccountDisabledError) {
    return new Response(error.message, { status: 403 });
  }
  return null;
}

export async function resolveActiveUser(): Promise<
  { user: User; supabase: SupabaseClient } | Response
> {
  try {
    return await requireActiveUser();
  } catch (error) {
    const response = authGuardResponse(error);
    if (response) {
      return response;
    }
    throw error;
  }
}
