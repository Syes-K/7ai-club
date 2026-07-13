import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdminEmail, parseAdminEmails } from "@/lib/admin/auth";

describe("admin auth", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parseAdminEmails splits and normalizes", () => {
    vi.stubEnv("ADMIN_EMAILS", " Admin@Example.com , other@test.com ");
    expect(parseAdminEmails()).toEqual(["admin@example.com", "other@test.com"]);
  });

  it("isAdminEmail is case-insensitive", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    expect(isAdminEmail("Admin@Example.com")).toBe(true);
    expect(isAdminEmail("other@test.com")).toBe(false);
  });

  it("isAdminEmail rejects non-allowlisted addresses (AC-126 / AC-141)", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
    expect(isAdminEmail("user@test.com")).toBe(false);
    expect(isAdminEmail("admin@example.com")).toBe(true);
  });
});
