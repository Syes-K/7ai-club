import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const track = vi.fn();

vi.mock("@vercel/analytics", () => ({
  track: (...args: unknown[]) => track(...args),
}));

import {
  isAnalyticsEnabled,
  PRODUCT_ANALYTICS_EVENTS,
  trackProductEvent,
} from "@/lib/analytics/events";

describe("AC-118 trackProductEvent", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercel = process.env.VERCEL;

  beforeEach(() => {
    track.mockReset();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = originalVercel;
    }
  });

  it("is disabled in development", () => {
    process.env.NODE_ENV = "development";
    delete process.env.VERCEL;

    expect(isAnalyticsEnabled()).toBe(false);
    trackProductEvent(PRODUCT_ANALYTICS_EVENTS.signInComplete);
    expect(track).not.toHaveBeenCalled();
  });

  it("is disabled for local production without VERCEL", () => {
    process.env.NODE_ENV = "production";
    delete process.env.VERCEL;

    expect(isAnalyticsEnabled()).toBe(false);
    trackProductEvent(PRODUCT_ANALYTICS_EVENTS.signInComplete);
    expect(track).not.toHaveBeenCalled();
  });

  it("tracks events on Vercel production", () => {
    process.env.NODE_ENV = "production";
    process.env.VERCEL = "1";

    expect(isAnalyticsEnabled()).toBe(true);
    trackProductEvent(PRODUCT_ANALYTICS_EVENTS.signInComplete);
    expect(track).toHaveBeenCalledWith("sign_in_complete");
  });
});
