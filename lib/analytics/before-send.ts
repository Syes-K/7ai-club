import type { BeforeSendEvent } from "@vercel/analytics";

/** Strip search + hash from event.url; keep absolute URL for Vercel ingest. */
export function redactAnalyticsEventUrl(
  event: BeforeSendEvent,
): BeforeSendEvent | null {
  try {
    const parsed = new URL(event.url);
    parsed.search = "";
    parsed.hash = "";
    return { ...event, url: parsed.toString() };
  } catch {
    return null;
  }
}
