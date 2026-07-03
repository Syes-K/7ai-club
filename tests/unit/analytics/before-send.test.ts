import { describe, expect, it } from "vitest";
import { redactAnalyticsEventUrl } from "@/lib/analytics/before-send";
import { testSiteUrl } from "../../fixtures/site";

describe("AC-116 redactAnalyticsEventUrl", () => {
  it("strips query strings but keeps absolute URL", () => {
    const result = redactAnalyticsEventUrl({
      url: `${testSiteUrl("/login")}?next=%2Fchat`,
    } as Parameters<typeof redactAnalyticsEventUrl>[0]);

    expect(result).toEqual({
      url: testSiteUrl("/login"),
    });
  });

  it("strips hash fragments", () => {
    const result = redactAnalyticsEventUrl({
      url: `${testSiteUrl("/chat/abc-123")}#msg`,
    } as Parameters<typeof redactAnalyticsEventUrl>[0]);

    expect(result).toEqual({
      url: testSiteUrl("/chat/abc-123"),
    });
  });

  it("keeps pathname segments unchanged", () => {
    const result = redactAnalyticsEventUrl({
      url: testSiteUrl("/console/models"),
    } as Parameters<typeof redactAnalyticsEventUrl>[0]);

    expect(result).toEqual({
      url: testSiteUrl("/console/models"),
    });
  });

  it("returns null for invalid URLs", () => {
    expect(
      redactAnalyticsEventUrl({
        url: "http://[::1",
      } as Parameters<typeof redactAnalyticsEventUrl>[0]),
    ).toBeNull();
  });
});
