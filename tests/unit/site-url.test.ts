import { afterEach, describe, expect, it } from "vitest";
import { getSiteUrl, siteUrl } from "@/lib/site-url";

describe("getSiteUrl", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
    if (originalVercelUrl === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = originalVercelUrl;
    }
  });

  it("uses NEXT_PUBLIC_SITE_URL when set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://7ai-club.vercel.app/";
    delete process.env.VERCEL_URL;

    expect(getSiteUrl()).toBe("https://7ai-club.vercel.app");
  });

  it("falls back to VERCEL_URL on the server", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_URL = "7ai-club-git-main.vercel.app";

    expect(getSiteUrl()).toBe("https://7ai-club-git-main.vercel.app");
  });

  it("defaults to localhost when no env is set", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;

    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});

describe("siteUrl", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
  });

  it("joins origin and pathname", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://7ai-club.vercel.app";

    expect(siteUrl("/login")).toBe("https://7ai-club.vercel.app/login");
  });
});
