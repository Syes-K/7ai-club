import { describe, expect, it } from "vitest";
import { isUserBannedFromRecord } from "@/lib/auth/ban";
import { deriveAdminUserStatus } from "@/lib/admin/users";

describe("isUserBannedFromRecord", () => {
  it("returns true when banned_until is in the future", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(isUserBannedFromRecord({ banned_until: future })).toBe(true);
  });

  it("returns false when banned_until is in the past", () => {
    expect(isUserBannedFromRecord({ banned_until: "2020-01-01T00:00:00Z" })).toBe(
      false,
    );
  });
});

describe("deriveAdminUserStatus", () => {
  it("returns Disabled when banned_until is in the future", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      deriveAdminUserStatus({
        banned_until: future,
        email_confirmed_at: "2026-01-01T00:00:00Z",
      }),
    ).toBe("Disabled");
  });

  it("returns Active when banned_until is in the past", () => {
    expect(
      deriveAdminUserStatus({
        banned_until: "2020-01-01T00:00:00Z",
        email_confirmed_at: "2026-01-01T00:00:00Z",
      }),
    ).toBe("Active");
  });

  it("returns Disabled when ban_duration is set on update payload", () => {
    expect(
      deriveAdminUserStatus({
        ban_duration: "876000h",
        email_confirmed_at: "2026-01-01T00:00:00Z",
      }),
    ).toBe("Disabled");
  });

  it("returns Unconfirmed when email is not confirmed and user is not banned", () => {
    expect(deriveAdminUserStatus({})).toBe("Unconfirmed");
  });
});
