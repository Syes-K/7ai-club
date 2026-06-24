import { expect, test } from "@playwright/test";
import { hasAuthCredentials, login } from "./helpers/auth";

test.describe("iter-05 console profile", () => {
  test.skip(!hasAuthCredentials, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD");
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("AC-45: profile cards default to detail view with edit actions", async ({
    page,
  }) => {
    await page.goto("/console/profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    const account = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Account" }),
    });
    const preferences = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Preferences" }),
    });

    await expect(account.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(preferences.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(account.getByLabel("Nickname")).toHaveCount(0);
    await expect(
      preferences.getByLabel("Preferred chat model"),
    ).toHaveCount(0);
  });

  test("AC-44: account save does not require preferences edit", async ({
    page,
  }) => {
    const profileApiRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/profile")) {
        profileApiRequests.push(request.url());
      }
    });

    await page.goto("/console/profile");

    const preferences = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Preferences" }),
    });
    const preferredBefore = await preferences
      .getByText(/Preferred chat model/i)
      .locator("xpath=following-sibling::dd[1]")
      .textContent();

    const account = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Account" }),
    });
    await account.getByRole("button", { name: "Edit" }).click();

    const uniqueNick = `E2E ${Date.now()}`;
    await account.getByLabel("Nickname").fill(uniqueNick);
    await account.getByRole("button", { name: "Save" }).click();
    await expect(account.getByText("Saved.")).toBeVisible({ timeout: 15_000 });

    await expect(preferences.getByRole("button", { name: "Edit" })).toBeVisible();
    const preferredAfter = await preferences
      .getByText(/Preferred chat model/i)
      .locator("xpath=following-sibling::dd[1]")
      .textContent();
    expect(preferredAfter).toBe(preferredBefore);

    expect(profileApiRequests).toEqual([]);
  });

  test("AC-43: preferences select only lists passed models", async ({
    page,
  }) => {
    await page.goto("/console/profile");

    const preferences = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Preferences" }),
    });
    await preferences.getByRole("button", { name: "Edit" }).click();

    const select = preferences.getByLabel("Preferred chat model");
    await expect(select).toBeVisible();

    const options = select.locator("option");
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const label = (await options.nth(i).textContent()) ?? "";
      expect(label).not.toMatch(/untested|failed/i);
    }
  });
});
