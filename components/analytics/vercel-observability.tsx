"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { redactAnalyticsEventUrl } from "@/lib/analytics/before-send";

export function VercelObservability() {
  return (
    <>
      <Analytics beforeSend={redactAnalyticsEventUrl} />
      <SpeedInsights />
    </>
  );
}
