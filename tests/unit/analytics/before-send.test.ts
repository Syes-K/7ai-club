import { describe, expect, it } from "vitest";
import { redactAnalyticsEventUrl } from "@/lib/analytics/before-send";

describe("AC-116 redactAnalyticsEventUrl", () => {
  it("strips query strings from page view URLs", () => {
    const result = redactAnalyticsEventUrl({
      url: "/login?next=%2Fchat",
    } as Parameters<typeof redactAnalyticsEventUrl>[0]);

    expect(result).toEqual({ url: "/login" });
  });

  it("strips hash fragments", () => {
    const result = redactAnalyticsEventUrl({
      url: "/chat/abc-123#msg",
    } as Parameters<typeof redactAnalyticsEventUrl>[0]);

    expect(result).toEqual({ url: "/chat/abc-123" });
  });

  it("keeps pathname segments unchanged", () => {
    const result = redactAnalyticsEventUrl({
      url: "/console/models",
    } as Parameters<typeof redactAnalyticsEventUrl>[0]);

    expect(result).toEqual({ url: "/console/models" });
  });

  it("returns null for invalid URLs", () => {
    expect(
      redactAnalyticsEventUrl({
        url: "http://[::1",
      } as Parameters<typeof redactAnalyticsEventUrl>[0]),
    ).toBeNull();
  });
});
