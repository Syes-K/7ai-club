/** Production origin for unit tests only — not used at runtime. */
export const TEST_SITE_ORIGIN = "https://7ai-club.vercel.app";

export function testSiteUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${TEST_SITE_ORIGIN}${path}`;
}
