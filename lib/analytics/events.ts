import { track } from "@vercel/analytics";

export const PRODUCT_ANALYTICS_EVENTS = {
  signUpComplete: "sign_up_complete",
  signInComplete: "sign_in_complete",
  conversationStarted: "conversation_started",
} as const;

export type ProductAnalyticsEvent =
  (typeof PRODUCT_ANALYTICS_EVENTS)[keyof typeof PRODUCT_ANALYTICS_EVENTS];

/** True only on Vercel production deployment. */
export function isAnalyticsEnabled(): boolean {
  return process.env.NODE_ENV === "production" && process.env.VERCEL === "1";
}

/** No-op outside Vercel production; never throws. */
export function trackProductEvent(name: ProductAnalyticsEvent): void {
  if (!isAnalyticsEnabled()) return;
  try {
    track(name);
  } catch {
    // Telemetry must not break UX.
  }
}
