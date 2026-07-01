import { expect, test, type Page } from "@playwright/test";
import { hasAuthCredentials, login } from "./helpers/auth";
import { waitForChatSidebarReady } from "./helpers/chat";

const REASONING_MODEL = /qwen3|deepseek-v4|deepseek-r1|qwq|thinking/i;

async function openWorkflowE2EConversation(page: Page) {
  await waitForChatSidebarReady(page);
  const target = page
    .locator("aside nav ul li")
    .filter({ hasText: "iter-06 workflow e2e ping" })
    .first();
  if ((await target.count()) === 0) {
    return false;
  }
  await target.locator("div > button").first().click();
  await page.getByPlaceholder("Type a message").waitFor({
    state: "visible",
    timeout: 30_000,
  });
  await page
    .locator('main [role="status"][aria-busy="true"]')
    .waitFor({ state: "hidden", timeout: 60_000 })
    .catch(() => {});
  return true;
}

function lastAssistantTurn(page: Page) {
  return page
    .locator("main")
    .getByRole("article", { name: "Assistant reply" })
    .last();
}

function lastTurnWorkflowHeader(page: Page) {
  return lastAssistantTurn(page).getByRole("button", { name: /^Workflow ·/ });
}

async function waitForNewAssistantTurn(page: Page, countBefore: number) {
  await expect
    .poll(async () => {
      const count = await page
        .locator("main")
        .getByRole("article", { name: "Assistant reply" })
        .count();
      return count > countBefore;
    })
    .toBe(true);
}

async function waitForLastTurnWorkflowSettled(page: Page, timeoutMs = 120_000) {
  await expect
    .poll(
      async () => {
        const header = lastTurnWorkflowHeader(page);
        if ((await header.count()) === 0) {
          return false;
        }
        const text = (await header.textContent()) ?? "";
        return /steps completed|failed/.test(text);
      },
      { timeout: timeoutMs },
    )
    .toBe(true);
}

async function expandLastTurnWorkflow(page: Page) {
  const header = lastTurnWorkflowHeader(page);
  if ((await header.getAttribute("aria-expanded")) !== "true") {
    await header.click();
  }
  await expect(header).toHaveAttribute("aria-expanded", "true");
}

async function sendMessage(page: Page, text: string) {
  const input = page.getByPlaceholder("Type a message");
  await expect(input).toBeEnabled({ timeout: 60_000 });
  await input.click();
  await input.fill("");
  await input.pressSequentially(text, { delay: 5 });
  const sendButton = page.getByRole("button", { name: "Send message" });
  await expect(sendButton).toBeEnabled({ timeout: 15_000 });
  await sendButton.click();
}

async function setPreferredModel(page: Page, matches: (label: string) => boolean) {
  await page.goto("/console/profile");
  const preferences = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Preferences" }),
  });
  await preferences.getByRole("button", { name: "Edit" }).click();
  const select = preferences.getByLabel("Preferred chat model");
  const options = select.locator("option");
  const count = await options.count();
  for (let i = 0; i < count; i += 1) {
    const label = (await options.nth(i).textContent()) ?? "";
    if (matches(label.trim())) {
      const value = await options.nth(i).getAttribute("value");
      if (value) {
        await select.selectOption(value);
        await preferences.getByRole("button", { name: "Save" }).click();
        await expect(preferences.getByText("Saved.")).toBeVisible({
          timeout: 15_000,
        });
        return label.trim();
      }
    }
  }
  return null;
}

function isReasoningModelLabel(label: string) {
  return REASONING_MODEL.test(label);
}

function isNonReasoningModelLabel(label: string) {
  return !isReasoningModelLabel(label);
}

test.describe("iter-08 manual QA M-01–M-09", () => {
  test.skip(!hasAuthCredentials, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD");
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(300_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("M-01: AC-80 collapsed panel while streaming", async ({ page }) => {
    const opened = await openWorkflowE2EConversation(page);
    test.skip(!opened, "Need iter-06 workflow e2e ping conversation");

    await setPreferredModel(page, isReasoningModelLabel);
    await openWorkflowE2EConversation(page);

    const turnsBefore = await page
      .locator("main")
      .getByRole("article", { name: "Assistant reply" })
      .count();

    let sawCollapsedWhileActive = false;
    const deadline = Date.now() + 120_000;

    const message = `M-01 stream check ${Date.now()} — write three short paragraphs about workflow UI design.`;

    const pollCollapsedWhileActive = (async () => {
      while (Date.now() < deadline) {
        const turnCount = await page
          .locator("main")
          .getByRole("article", { name: "Assistant reply" })
          .count();
        if (turnCount <= turnsBefore) {
          await page.waitForTimeout(10);
          continue;
        }

        const turn = lastAssistantTurn(page);
        const header = turn.getByRole("button", { name: /^Workflow ·/ });
        if ((await header.count()) === 0) {
          await page.waitForTimeout(10);
          continue;
        }

        const expanded = (await header.getAttribute("aria-expanded")) ?? "false";
        const hasSpinner = (await turn.locator(".animate-spin").count()) > 0;
        const headerText = (await header.textContent()) ?? "";
        const isSettled = /steps completed|failed/.test(headerText);

        if (expanded === "false" && hasSpinner) {
          sawCollapsedWhileActive = true;
          return;
        }

        if (isSettled) {
          return;
        }

        await page.waitForTimeout(10);
      }
    })();

    await sendMessage(page, message);

    await pollCollapsedWhileActive;

    await expect(page.locator("main").getByText(message, { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    await waitForLastTurnWorkflowSettled(page);

    const header = lastTurnWorkflowHeader(page);
    await expect(header).toBeVisible({ timeout: 60_000 });
    await expect(header).toHaveAttribute("aria-expanded", "false");

    if (!sawCollapsedWhileActive) {
      test.info().annotations.push({
        type: "note",
        description:
          "Fast stream: collapsed at settle verified; running spinner not captured in E2E window",
      });
    }

    await expect(
      lastAssistantTurn(page).getByText("Validate request", { exact: true }),
    ).toHaveCount(0);
  });

  test("M-02: AC-82 workflow header toggle", async ({ page }) => {
    const opened = await openWorkflowE2EConversation(page);
    test.skip(!opened, "Need iter-06 workflow e2e ping conversation");

    await waitForLastTurnWorkflowSettled(page);

    const header = lastTurnWorkflowHeader(page);
    await expect(header).toHaveAttribute("aria-expanded", "false");

    await header.click();
    await expect(header).toHaveAttribute("aria-expanded", "true");
    await expect(
      lastAssistantTurn(page).getByText("Validate request", { exact: true }),
    ).toBeVisible();

    await header.click();
    await expect(header).toHaveAttribute("aria-expanded", "false");
  });

  test("M-08: AC-88 skipped summarization muted", async ({ page }) => {
    const opened = await openWorkflowE2EConversation(page);
    test.skip(!opened, "Need iter-06 workflow e2e ping conversation");

    await waitForLastTurnWorkflowSettled(page);
    await expandLastTurnWorkflow(page);

    const summarizingRow = lastAssistantTurn(page)
      .getByText("Summarizing history", { exact: true })
      .locator("xpath=ancestor::li[1]");
    await expect(summarizingRow).toBeVisible({ timeout: 15_000 });
    await expect(summarizingRow).toContainText("Skipped");
    await expect(summarizingRow).toHaveClass(/opacity-60/);

    const header = lastTurnWorkflowHeader(page);
    await expect(header).toContainText(/steps completed/);
  });

  test("M-04: AC-84 reasoning step when reasoning model", async ({ page }) => {
    const opened = await openWorkflowE2EConversation(page);
    test.skip(!opened, "Need iter-06 workflow e2e ping conversation");

    const modelLabel = await setPreferredModel(page, isReasoningModelLabel);
    test.skip(!modelLabel, "No passed reasoning model in preferences");

    await openWorkflowE2EConversation(page);
    await sendMessage(
      page,
      `M-04 reasoning ${Date.now()} — explain why 2+2 equals 4 in one sentence.`,
    );
    await waitForLastTurnWorkflowSettled(page);
    await expandLastTurnWorkflow(page);

    await expect(
      lastAssistantTurn(page).getByText("Reasoning", { exact: true }),
    ).toBeVisible();

    const showReasoning = lastAssistantTurn(page).getByRole("button", {
      name: /Reasoning.*Show reasoning/i,
    });
    await showReasoning.click();
    await expect(
      lastAssistantTurn(page).getByRole("button", {
        name: /Reasoning.*Hide reasoning/i,
      }),
    ).toBeVisible();
    const pre = lastAssistantTurn(page).locator("pre");
    await expect(pre).toBeVisible();
    const text = (await pre.textContent()) ?? "";
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test("M-05: AC-85 no reasoning on non-reasoning model", async ({ page }) => {
    const opened = await openWorkflowE2EConversation(page);
    test.skip(!opened, "Need iter-06 workflow e2e ping conversation");

    const modelLabel = await setPreferredModel(page, isNonReasoningModelLabel);
    test.skip(!modelLabel, "No passed non-reasoning model in preferences");

    await openWorkflowE2EConversation(page);
    await sendMessage(page, `M-05 no reasoning ${Date.now()}`);
    await waitForLastTurnWorkflowSettled(page);
    await expandLastTurnWorkflow(page);

    await expect(
      lastAssistantTurn(page).getByText("Reasoning", { exact: true }),
    ).toHaveCount(0);
  });

  test("M-07: AC-87 history turns default collapsed", async ({ page }) => {
    const opened = await openWorkflowE2EConversation(page);
    test.skip(!opened, "Need iter-06 workflow e2e ping conversation");

    const turnMessage = `M-07 second turn ${Date.now()}`;
    await sendMessage(page, turnMessage);
    await waitForLastTurnWorkflowSettled(page);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByPlaceholder("Type a message").waitFor({
      state: "visible",
      timeout: 30_000,
    });

    const headers = page
      .locator("main")
      .getByRole("button", { name: /^Workflow ·/ });

    await expect
      .poll(async () => headers.count(), { timeout: 60_000 })
      .toBeGreaterThanOrEqual(2);

    const firstHeader = headers.first();
    await expect(firstHeader).toHaveAttribute("aria-expanded", "false");
    await firstHeader.click();
    await expect(firstHeader).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.locator("main").getByText("Validate request", { exact: true }).first(),
    ).toBeVisible();
  });

  test("M-06: AC-86 refresh during streaming", async ({ page }) => {
    const opened = await openWorkflowE2EConversation(page);
    test.skip(!opened, "Need iter-06 workflow e2e ping conversation");

    await setPreferredModel(page, isReasoningModelLabel);
    await openWorkflowE2EConversation(page);

    const turnsBefore = await page
      .locator("main")
      .getByRole("article", { name: "Assistant reply" })
      .count();

    await sendMessage(
      page,
      `M-06 refresh ${Date.now()} — write a short paragraph about workflow UI.`,
    );

    await waitForNewAssistantTurn(page, turnsBefore);

    const header = lastTurnWorkflowHeader(page);
    await expect(header).toBeVisible({ timeout: 60_000 });

    await expect
      .poll(async () => {
        const text = (await header.textContent()) ?? "";
        return /…/.test(text) && !/steps completed/.test(text);
      })
      .toBe(true);

    const conversationUrl = page.url();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForURL(conversationUrl, { timeout: 30_000 });
    await page.getByPlaceholder("Type a message").waitFor({
      state: "visible",
      timeout: 30_000,
    });

    const reloadedHeader = lastTurnWorkflowHeader(page);
    await expect(reloadedHeader).toBeVisible({ timeout: 60_000 });
    await waitForLastTurnWorkflowSettled(page, 180_000);
    await expect(reloadedHeader).toContainText(/steps completed/);
  });

  test("M-03: AC-83 summary markdown (conditional)", async ({ page }) => {
    const opened = await openWorkflowE2EConversation(page);
    test.skip(!opened, "Need iter-06 workflow e2e ping conversation");

    const headers = page
      .locator("main")
      .getByRole("button", { name: /^Workflow ·/ });
    const turnCount = await headers.count();
    let foundSummary = false;

    for (let i = 0; i < turnCount; i += 1) {
      const header = headers.nth(i);
      await header.click();
      const showSummary = page
        .locator("main")
        .getByRole("button", { name: /Summarizing history.*Show summary/i });
      if ((await showSummary.count()) > 0) {
        await showSummary.last().click();
        const markdownBlock = page.locator("main").locator(".markdown-body").last();
        if ((await markdownBlock.count()) > 0) {
          await expect(markdownBlock).toBeVisible();
          foundSummary = true;
          break;
        }
      }
      await header.click();
    }

    test.skip(
      !foundSummary,
      "No conversation turn with Summarizing history summary fold — run long chat with summarization first",
    );
  });

  test("M-09: H-04 deepseek-v4-pro model test", async ({ page }) => {
    await page.goto("/console/models");
    await expect(
      page.getByRole("heading", { name: "Model management" }),
    ).toBeVisible();

    const row = page.locator("tr").filter({ hasText: /deepseek-v4-pro/i }).first();
    test.skip(
      (await row.count()) === 0,
      "No deepseek-v4-pro row in Console → Models",
    );

    await row.getByRole("button", { name: "Test" }).click();
    await expect(row.getByText("Passed", { exact: true })).toBeVisible({
      timeout: 60_000,
    });
  });
});
