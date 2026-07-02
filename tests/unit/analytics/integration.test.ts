import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("AC-111/AC-112 Vercel observability integration", () => {
  it("mounts VercelObservability in root layout", () => {
    const layout = readFileSync("app/layout.tsx", "utf-8");
    expect(layout).toContain("VercelObservability");
    expect(layout).toContain("@/components/analytics/vercel-observability");
  });

  it("declares analytics dependencies", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf-8")) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies["@vercel/analytics"]).toBeDefined();
    expect(pkg.dependencies["@vercel/speed-insights"]).toBeDefined();
  });

  it("wires Analytics and SpeedInsights with beforeSend", () => {
    const component = readFileSync(
      "components/analytics/vercel-observability.tsx",
      "utf-8",
    );
    expect(component).toContain("@vercel/analytics/next");
    expect(component).toContain("@vercel/speed-insights/next");
    expect(component).toContain("beforeSend={redactAnalyticsEventUrl}");
  });
});

describe("AC-113/AC-114 auth event wiring", () => {
  it("tracks sign-in and sign-up events in auth form", () => {
    const auth = readFileSync("components/auth/auth-form.tsx", "utf-8");
    expect(auth).toContain("PRODUCT_ANALYTICS_EVENTS.signInComplete");
    expect(auth).toContain("PRODUCT_ANALYTICS_EVENTS.signUpComplete");
    expect(auth).toContain("trackProductEvent");
  });
});

describe("AC-115 conversation event wiring", () => {
  it("tracks conversation_started after createConversation", () => {
    const shell = readFileSync("components/chat/chat-app-shell.tsx", "utf-8");
    expect(shell).toContain("PRODUCT_ANALYTICS_EVENTS.conversationStarted");
    expect(shell).toMatch(/createConversation\([\s\S]*trackProductEvent/);
  });
});
