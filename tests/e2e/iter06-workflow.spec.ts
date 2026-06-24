import { expect, test } from "@playwright/test";
import { hasAuthCredentials, login } from "./helpers/auth";
import { waitForChatSidebarReady } from "./helpers/chat";

const WORKFLOW_STEP_LABELS = [
  "Validate request",
  "Load context",
  "Resolve model",
  "Generate response",
] as const;

async function openAssistantConversation(page: import("@playwright/test").Page) {
  await waitForChatSidebarReady(page);
  const target = page
    .locator("aside nav ul li")
    .filter({ hasText: "7ai Assistant" })
    .first();
  if ((await target.count()) === 0) {
    return false;
  }

  await target.locator("div > button").first().click();
  await page.getByPlaceholder("Type a message").waitFor({
    state: "visible",
    timeout: 30_000,
  });
  return true;
}

test.describe("iter-06 workflow orchestration", () => {
  test.skip(!hasAuthCredentials, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD");
  test.describe.configure({ mode: "serial", retries: 1 });
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("AC-50: chat shows four English workflow steps after send", async ({
    page,
  }) => {
    const opened = await openAssistantConversation(page);
    test.skip(!opened, "Need an existing 7ai Assistant conversation for E2E");

    const input = page.getByPlaceholder("Type a message");
    await expect(input).toBeEnabled({ timeout: 15_000 });
    const message = `iter-06 workflow ${Date.now()}`;
    await input.fill(message);
    await input.press("Enter");

    await expect
      .poll(
        async () => {
          const summaryVisible = await page
            .locator("main")
            .getByText("4 steps completed")
            .isVisible()
            .catch(() => false);
          if (summaryVisible) {
            return 4;
          }

          let count = 0;
          for (const label of WORKFLOW_STEP_LABELS) {
            if (
              await page
                .locator("main")
                .getByText(label, { exact: true })
                .isVisible()
                .catch(() => false)
            ) {
              count += 1;
            }
          }
          return count;
        },
        { timeout: 120_000 },
      )
      .toBeGreaterThanOrEqual(4);
  });
});
