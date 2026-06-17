import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("landing page loads with 7AI branding", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/7AI/i);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("unauthenticated user can reach login page", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Sign in to 7ai-club" }),
    ).toBeVisible();
  });
});
