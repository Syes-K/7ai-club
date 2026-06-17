/** Allow only same-origin relative paths (blocks open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/chat"): string {
  if (next?.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return fallback;
}

/** Email confirmation / magic-link callback (must be in Supabase Redirect URLs). */
export function getEmailRedirectTo(next: string): string {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", safeNextPath(next));
  return url.toString();
}
