import { expect, test } from "@playwright/test";
import { hasAuthCredentials, login } from "./helpers/auth";

test.describe("iter-05 console models", () => {
  test.skip(!hasAuthCredentials, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD");
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("AC-40: models page lists platform models without exposing keys", async ({
    page,
  }) => {
    const modelApiResponses: string[] = [];
    page.on("response", async (response) => {
      const url = response.url();
      if (!url.includes("/api/models")) return;
      if (!response.ok()) return;
      try {
        modelApiResponses.push(await response.text());
      } catch {
        // ignore
      }
    });

    await page.goto("/console/models");
    await expect(
      page.getByRole("heading", { name: "Model management" }),
    ).toBeVisible();

    await expect(page.getByText("Platform", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Add model" })).toBeVisible();

    for (const body of modelApiResponses) {
      expect(body.toLowerCase()).not.toMatch(/sk-[a-z0-9]/);
      expect(body).not.toMatch(/apiKey"\s*:\s*"/);
    }
  });

  test("AC-41: update key dialog opens from row action", async ({ page }) => {
    await page.goto("/console/models");

    const customRow = page
      .locator("tr")
      .filter({ hasText: "Custom" })
      .first();

    if ((await customRow.count()) === 0) {
      test.skip(true, "No custom model row — add one manually for full AC-41 E2E");
    }

    await customRow.getByRole("button", { name: "Update key" }).click();
    await expect(
      page.getByRole("heading", { name: /update api key/i }),
    ).toBeVisible();
  });
});
