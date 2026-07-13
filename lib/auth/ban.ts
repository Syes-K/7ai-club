export const ACCOUNT_DISABLED_MESSAGE =
  "Your account has been disabled. Contact support.";

export function isUserBannedFromRecord(user: {
  ban_duration?: string | null;
  banned_until?: string | null;
} | null | undefined): boolean {
  if (!user) {
    return false;
  }

  if (user.ban_duration && user.ban_duration !== "none") {
    return true;
  }

  const bannedUntil = user.banned_until;
  if (!bannedUntil) {
    return false;
  }

  const until = new Date(bannedUntil);
  return !Number.isNaN(until.getTime()) && until.getTime() > Date.now();
}
