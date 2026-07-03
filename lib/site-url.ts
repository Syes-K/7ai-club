function normalizeOrigin(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Canonical public site origin (no trailing slash).
 * Prefer NEXT_PUBLIC_SITE_URL on Vercel production; falls back to VERCEL_URL or localhost.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return normalizeOrigin(fromEnv);

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

/** Build an absolute URL for a same-site path. */
export function siteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${path}`;
}
