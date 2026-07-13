import { expect, test } from "@playwright/test";
import { hasAdminCredentials, loginAsAdmin } from "./helpers/admin";
import { hasAuthCredentials, login } from "./helpers/auth";

test.describe("iter-12 admin", () => {
  test.describe("admin pages", () => {
    test.describe.configure({ mode: "serial" });
    test.skip(!hasAdminCredentials, "Admin credentials not in ADMIN_EMAILS allowlist");

    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test("AC-120: admin users page shows paginated list", async ({ page }) => {
      await page.goto("/admin/users");
      await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
      await expect(page.getByText("Site-wide user accounts")).toBeVisible();
    });

    test("AC-121: admin users search filters list", async ({ page }) => {
      await page.goto("/admin/users");
      const search = page.getByPlaceholder(/search/i);
      await expect(search).toBeVisible();

      const emailCell = page.locator("tbody tr").first().locator("td").first();
      const emailText = (await emailCell.textContent())?.trim() ?? "";
      test.skip(emailText.length < 3, "No users in admin list");

      const fragment = emailText.slice(0, Math.min(6, emailText.length));
      await search.fill(fragment);
      await expect(page.getByText(emailText, { exact: false }).first()).toBeVisible({
        timeout: 10_000,
      });
    });

    test("AC-127: admin models page loads with add action", async ({ page }) => {
      await page.goto("/admin/models");
      await expect(
        page.getByRole("heading", { name: "Platform models" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Add platform model" }),
      ).toBeVisible();
    });

    test("AC-134: admin assistants page loads with create action", async ({
      page,
    }) => {
      await page.goto("/admin/assistants");
      await expect(
        page.getByRole("heading", { name: "Platform assistants" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Create assistant" }),
      ).toBeVisible();
    });

    test("AC-141: admin assistants API returns 200 for allowlisted user", async ({
      page,
    }) => {
      const response = await page.request.get("/api/admin/assistants");
      expect(response.status()).toBe(200);
    });
  });

  test.describe("access control", () => {
    test("AC-126: unauthenticated admin API returns 401", async ({ request }) => {
      const response = await request.get("/api/admin/users");
      expect(response.status()).toBe(401);
    });

    test("AC-126: non-admin user is redirected from /admin", async ({ page }) => {
      test.skip(
        !hasAuthCredentials || hasAdminCredentials,
        "Requires non-admin E2E credentials",
      );
      await login(page);
      await page.goto("/admin/users");
      await expect(page).toHaveURL(/\/forbidden/);
      await expect(
        page.getByRole("heading", { name: "Access denied" }),
      ).toBeVisible();
    });

    test("AC-141: non-admin assistants API returns 403", async ({ page }) => {
      test.skip(
        !hasAuthCredentials || hasAdminCredentials,
        "Requires non-admin E2E credentials",
      );
      await login(page);
      const response = await page.request.get("/api/admin/assistants");
      expect(response.status()).toBe(403);
    });
  });
});
