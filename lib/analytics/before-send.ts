import type { BeforeSendEvent } from "@vercel/analytics";

/** Strip search + hash from event.url; drop event on parse failure. */
export function redactAnalyticsEventUrl(
  event: BeforeSendEvent,
): BeforeSendEvent | null {
  try {
    const parsed = new URL(event.url, "https://placeholder.local");
    const pathname = parsed.pathname || "/";
    return { ...event, url: pathname };
  } catch {
    return null;
  }
}
