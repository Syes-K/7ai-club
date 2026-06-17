export function getUserInitials(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "";
  if (local.length >= 2) {
    return local.slice(0, 2).toUpperCase();
  }
  return local.slice(0, 1).toUpperCase() || "?";
}

/** Local part before @, for compact header display. */
export function getUserShortLabel(
  email: string,
  nickname?: string | null,
  maxLen = 12,
): string {
  const source = nickname?.trim() || email.split("@")[0]?.trim() || email;
  if (source.length <= maxLen) return source;
  return `${source.slice(0, maxLen - 1)}…`;
}

export function getUserDisplayLabel(
  email: string,
  nickname?: string | null,
): string {
  return nickname?.trim() || email;
}

export function getUserDisplayName(
  email: string,
  nickname?: string | null,
): string {
  return nickname?.trim() || email.split("@")[0]?.trim() || email;
}
