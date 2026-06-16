export function getUserInitials(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "";
  if (local.length >= 2) {
    return local.slice(0, 2).toUpperCase();
  }
  return local.slice(0, 1).toUpperCase() || "?";
}

/** Local part before @, for compact header display. */
export function getUserShortLabel(email: string, maxLen = 12): string {
  const local = email.split("@")[0]?.trim() ?? email;
  if (local.length <= maxLen) return local;
  return `${local.slice(0, maxLen - 1)}…`;
}

export function getUserDisplayLabel(email: string): string {
  return email;
}
