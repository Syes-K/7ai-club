import { expect, test } from "@playwright/test";
import { hasAuthCredentials, login } from "./helpers/auth";
import { waitForChatSidebarReady } from "./helpers/chat";

const ITER07_WORKFLOW_STEP_LABELS = [
  "Validate request",
  "Load context",
  "Loading memory summary",
  "Resolve model",
  "Generate response",
  "Evaluating context size",
  "Summarizing history",
] as const;

const ITER06_WORKFLOW_STEP_LABELS = [
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

async function getLastCompletedStepCount(
  page: import("@playwright/test").Page,
): Promise<number> {
  const summaries = page
    .locator("main")
    .getByRole("button", { name: /Workflow · \d+ steps completed/ });
  const count = await summaries.count();
  if (count === 0) {
    return 0;
  }

  const text = await summaries.last().textContent();
  return Number(text?.match(/(\d+) steps completed/)?.[1] ?? 0);
}

test.describe("iter-06/07 workflow orchestration", () => {
  test.skip(!hasAuthCredentials, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD");
  test.describe.configure({ mode: "serial", retries: 1 });
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("AC-50 / AC-77: chat shows workflow steps after send", async ({ page }) => {
    const opened = await openAssistantConversation(page);
    test.skip(!opened, "Need an existing 7ai Assistant conversation for E2E");

    const input = page.getByPlaceholder("Type a message");
    await expect(input).toBeEnabled({ timeout: 15_000 });
    const message = `workflow steps ${Date.now()}`;
    await input.fill(message);
    await input.press("Enter");

    await expect
      .poll(async () => getLastCompletedStepCount(page), { timeout: 120_000 })
      .toBeGreaterThanOrEqual(4);

    const completedCount = await getLastCompletedStepCount(page);
    const labels =
      completedCount >= ITER07_WORKFLOW_STEP_LABELS.length
        ? ITER07_WORKFLOW_STEP_LABELS
        : ITER06_WORKFLOW_STEP_LABELS;

    const stepsSummary = page
      .locator("main")
      .getByRole("button", { name: /Workflow · \d+ steps completed/ })
      .last();

    await stepsSummary.click();

    for (const label of labels) {
      await expect(
        page.locator("main").getByText(label, { exact: true }),
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});
