import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { hasAuthCredentials, login } from "./helpers/auth";
import { waitForChatSidebarReady } from "./helpers/chat";

async function openFirstConversation(page: Page): Promise<boolean> {
  await waitForChatSidebarReady(page);
  const first = page.locator("aside nav ul li").first();
  if ((await first.count()) === 0) return false;
  await first.locator("div > button").first().click();
  await page.getByPlaceholder("Type a message").waitFor({
    state: "visible",
    timeout: 30_000,
  });
  return true;
}

test.describe("iter-05 chat model label", () => {
  test.skip(!hasAuthCredentials, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD");
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("AC-46: chat header shows preferred model label", async ({ page }) => {
    await page.goto("/console/profile");
    const preferences = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Preferences" }),
    });
    const preferredLabel =
      (await preferences
        .getByText(/Preferred chat model/i)
        .locator("xpath=following-sibling::dd[1]")
        .textContent()) ?? "";

    expect(preferredLabel.trim().length).toBeGreaterThan(0);

    const hasChat = await openFirstConversation(page);
    test.skip(!hasChat, "No conversations — create one manually for AC-46 E2E");

    await expect(
      page.locator("header").getByText(preferredLabel.trim()),
    ).toBeVisible({
      timeout: 15_000,
    });
  });
});
