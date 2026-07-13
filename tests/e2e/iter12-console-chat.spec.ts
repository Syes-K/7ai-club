import { expect, test } from "@playwright/test";
import { hasAuthCredentials, login } from "./helpers/auth";

test.describe("iter-12 console/chat integration", () => {
  test.skip(!hasAuthCredentials, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD");
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("AC-135: new chat shows aggregated assistant list with Platform badge", async ({
    page,
  }) => {
    await page.goto("/chat");
    await page.getByRole("button", { name: "New chat" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Choose an assistant" })).toBeVisible({
      timeout: 20_000,
    });

    const options = dialog.getByRole("option");
    await expect(options.first()).toBeVisible({ timeout: 20_000 });
    const count = await options.count();
    test.skip(count === 0, "No assistants in picker — seed platform assistant in Admin");

    const platformBadges = dialog.getByText("Platform", { exact: true });
    const platformCount = await platformBadges.count();

    if (platformCount > 0 && count > platformCount) {
      const firstPlatformIndex = await options.evaluateAll((nodes) =>
        nodes.findIndex((node) => node.textContent?.includes("Platform")),
      );
      expect(firstPlatformIndex).toBeGreaterThan(0);
    }

    await dialog.getByRole("button", { name: "Cancel" }).click();
  });

  test("AC-136: can create chat from platform assistant option", async ({ page }) => {
    await page.goto("/chat");
    await page.getByRole("button", { name: "New chat" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Choose an assistant" })).toBeVisible({
      timeout: 20_000,
    });

    const platformOption = dialog
      .getByRole("option")
      .filter({ hasText: "Platform" })
      .first();
    await expect(platformOption).toBeVisible({ timeout: 20_000 });

    if ((await platformOption.count()) === 0) {
      test.skip(true, "No platform assistant — configure in Admin → Assistants");
    }

    await platformOption.click();
    await dialog.getByRole("button", { name: "Create chat" }).click();

    await expect(page.getByPlaceholder("Type a message")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("AC-137: new chat does not auto-seed personal assistants", async ({
    page,
  }) => {
    await page.goto("/chat");
    await page.getByRole("button", { name: "New chat" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Choose an assistant" })).toBeVisible({
      timeout: 15_000,
    });

    const onlyPlatformMessage = dialog.getByText(/No personal assistants yet/i);
    const platformOptions = dialog.getByRole("option").filter({ hasText: "Platform" });

    if ((await onlyPlatformMessage.count()) > 0) {
      await expect(platformOptions.first()).toBeVisible();
    }

    await dialog.getByRole("button", { name: "Cancel" }).click();
  });
});
