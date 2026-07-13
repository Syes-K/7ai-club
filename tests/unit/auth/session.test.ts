import { describe, expect, it } from "vitest";
import { isUserAppPath } from "@/lib/auth/session";

describe("isUserAppPath", () => {
  it("matches user-facing pages and APIs", () => {
    expect(isUserAppPath("/chat")).toBe(true);
    expect(isUserAppPath("/console/profile")).toBe(true);
    expect(isUserAppPath("/api/chat")).toBe(true);
    expect(isUserAppPath("/api/models")).toBe(true);
    expect(isUserAppPath("/api/knowledge/abc/ingest")).toBe(true);
  });

  it("excludes admin routes", () => {
    expect(isUserAppPath("/admin/users")).toBe(false);
    expect(isUserAppPath("/api/admin/users")).toBe(false);
  });
});
