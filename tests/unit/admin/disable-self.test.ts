import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAdmin = vi.fn();
const disableAdminUser = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  requireAdmin: (...args: unknown[]) => requireAdmin(...args),
}));

vi.mock("@/lib/admin/users", () => ({
  disableAdminUser: (...args: unknown[]) => disableAdminUser(...args),
}));

import { POST } from "@/app/api/admin/users/[id]/disable/route";

describe("AC-125 disable self guard", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    disableAdminUser.mockReset();
    requireAdmin.mockResolvedValue({ id: "admin-self" });
  });

  it("returns 400 when admin targets own account", async () => {
    const response = await POST(new Request("http://localhost/api/admin/users/admin-self/disable"), {
      params: Promise.resolve({ id: "admin-self" }),
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Cannot disable your own account");
    expect(disableAdminUser).not.toHaveBeenCalled();
  });

  it("disables another user when ids differ", async () => {
    disableAdminUser.mockResolvedValue(undefined);

    const response = await POST(new Request("http://localhost/api/admin/users/other-user/disable"), {
      params: Promise.resolve({ id: "other-user" }),
    });

    expect(response.status).toBe(200);
    expect(disableAdminUser).toHaveBeenCalledWith("other-user");
  });
});
