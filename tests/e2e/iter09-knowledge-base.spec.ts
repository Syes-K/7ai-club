import { expect, test } from "@playwright/test";
import { hasAuthCredentials, login } from "./helpers/auth";
import {
  sidebarNewChatButton,
  waitForChatSidebarReady,
  waitForConversationShell,
} from "./helpers/chat";

const hasEmbeddingKey = Boolean(process.env.SILICONFLOW_API_KEY?.trim());

async function waitForKbStatus(
  page: import("@playwright/test").Page,
  kbName: string,
  status: "Ready" | "Processing" | "Error",
  timeoutMs = 180_000,
) {
  const row = page.locator("tr").filter({ hasText: kbName });
  await expect(row.getByText(status, { exact: true })).toBeVisible({
    timeout: timeoutMs,
  });
}

async function waitForChatNavigationIdle(
  page: import("@playwright/test").Page,
) {
  await page
    .locator('main [role="status"][aria-busy="true"]')
    .waitFor({ state: "hidden", timeout: 60_000 })
    .catch(() => { });
}

async function sendChatMessage(
  page: import("@playwright/test").Page,
  text: string,
) {
  const input = page.getByPlaceholder("Type a message");
  await expect(input).toBeEnabled({ timeout: 60_000 });
  await input.click();
  await input.fill("");
  await input.pressSequentially(text, { delay: 5 });
  const sendButton = page.getByRole("button", { name: "Send message" });
  await expect(sendButton).toBeEnabled({ timeout: 15_000 });
  await sendButton.click();
}

async function openE2ERagConversation(
  page: import("@playwright/test").Page,
): Promise<boolean> {
  await waitForChatSidebarReady(page);
  const target = page
    .locator("aside nav ul li")
    .filter({ hasText: "E2E RAG" })
    .first();
  if ((await target.count()) === 0) {
    return false;
  }
  await target.locator("div > button").first().click();
  await waitForConversationShell(page);
  await waitForChatNavigationIdle(page);
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

test.describe("iter-09 knowledge base RAG", () => {
  test.skip(!hasAuthCredentials, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD");
  test.describe.configure({ mode: "serial", retries: 0 });
  test.setTimeout(240_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("AC-90: create knowledge base with pasted text", async ({ page }) => {
    const kbName = `E2E KB ${Date.now()}`;

    await page.goto("/console/knowledge");
    await expect(
      page.getByRole("heading", { name: "Knowledge Base" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Create knowledge base" }).click();
    await expect(
      page.getByRole("heading", { name: "Create knowledge base" }),
    ).toBeVisible();

    await page.getByLabel("Name").fill(kbName);
    await page.getByLabel("Description").fill("E2E iter-09 validation");
    await page.getByRole("radio", { name: "Paste text" }).check();
    await page
      .getByLabel("Content")
      .fill("# FAQ\n\nE2E-KB-MARKER-iter09 unique refund policy is 30 days.");

    await page.getByRole("button", { name: "Create", exact: true }).click();

    const row = page.locator("tr").filter({ hasText: kbName });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText("Processing", { exact: true })).toBeVisible();
  });

  test("AC-91 + AC-93: ingest to ready and recall test shows hits", async ({
    page,
  }) => {
    test.skip(!hasEmbeddingKey, "Set SILICONFLOW_API_KEY for ingest/recall E2E");

    await page.goto("/console/knowledge");
    const kbName = await page
      .locator("tr")
      .filter({ hasText: "E2E KB" })
      .first()
      .locator("td")
      .first()
      .textContent() || '';

    test.skip(!kbName?.trim(), "Need AC-90 KB from prior test");

    await waitForKbStatus(page, kbName.trim(), "Ready");

    await page
      .locator("tr")
      .filter({ hasText: kbName.trim() })
      .getByRole("link", { name: "View" })
      .click();

    await expect(page.getByRole("heading", { name: kbName.trim() })).toBeVisible();
    await expect(page.getByText("Ready", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Recall test" }).click();
    await expect(page.getByRole("heading", { name: "Recall test" })).toBeVisible();

    const recallDialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { name: "Recall test" }),
    });
    await recallDialog
      .getByPlaceholder("Ask a question to test retrieval")
      .fill("What is the E2E-KB-MARKER-iter09 refund policy?");
    await recallDialog.getByRole("button", { name: "Run recall test" }).click();

    await expect(page.getByRole("columnheader", { name: "Score" })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole("columnheader", { name: "Location" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Content" })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: /E2E-KB-MARKER-iter09 unique refund policy/ }),
    ).toBeVisible();
  });

  test("AC-94: profile shows RAG retrieval preferences", async ({ page }) => {
    await page.goto("/console/profile");

    const preferences = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Preferences" }),
    });

    await expect(
      preferences.getByText("RAG retrieval", { exact: true }),
    ).toBeVisible();
    await preferences.getByRole("button", { name: "Edit" }).click();
    await expect(preferences.getByLabel("Confidence threshold")).toBeVisible();
    await expect(preferences.getByLabel("Top K")).toBeVisible();
    await expect(preferences.getByLabel("Query optimization")).toBeVisible();
    await expect(preferences.getByLabel("Embedding model")).toBeVisible();
  });

  test("AC-95 + AC-99: bind KB to assistant and block delete with 409", async ({
    page,
  }) => {
    test.skip(!hasEmbeddingKey, "Set SILICONFLOW_API_KEY for ready KB binding");

    await page.goto("/console/knowledge");
    const kbRow = page.locator("tr").filter({ hasText: "E2E KB" }).first();
    const kbName = (await kbRow.locator("td").first().textContent())?.trim() || '';
    test.skip(!kbName, "Need ready KB from prior tests");

    if (!(await kbRow.getByText("Ready", { exact: true }).isVisible())) {
      await waitForKbStatus(page, kbName, "Ready");
    }

    const assistantName = `E2E RAG ${Date.now()}`;
    await page.goto("/console/assistants");
    await page.getByRole("button", { name: "Create assistant" }).click();
    await page.getByLabel("Name").fill(assistantName);
    await page.getByLabel("System prompt").fill("You answer from knowledge bases.");
    await page.getByLabel("Opening message").fill("Hello");

    await page.locator("#assistant-knowledge-bases").click();
    await page
      .getByRole("listbox")
      .getByRole("option", { name: kbName })
      .click();
    await page.getByRole("heading", { name: "Create assistant" }).click();

    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText(assistantName)).toBeVisible({ timeout: 15_000 });

    await page.goto("/console/knowledge");
    const row = page.locator("tr").filter({ hasText: kbName });
    await row.getByRole("button", { name: "Delete" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete", exact: true })
      .click();

    await expect(page.getByText(/bound to \d+ assistant/i)).toBeVisible({
      timeout: 15_000,
    });

    await waitForChatSidebarReady(page);
    await sidebarNewChatButton(page).click();
    await page.getByRole("option", { name: assistantName }).click();
    await page.getByRole("button", { name: "Create chat" }).click();
    await waitForConversationShell(page);
    await waitForChatNavigationIdle(page);
  });

  test("AC-96 + AC-97: chat workflow shows RAG steps for KB-bound assistant", async ({
    page,
  }) => {
    test.skip(!hasEmbeddingKey, "Set SILICONFLOW_API_KEY for RAG chat E2E");

    const opened = await openE2ERagConversation(page);
    test.skip(!opened, "Need E2E RAG conversation in sidebar");

    const message = `What is E2E-KB-MARKER-iter09? ${Date.now()}`;
    await sendChatMessage(page, message);

    const input = page.getByPlaceholder("Type a message");
    await expect(input).toBeEnabled({ timeout: 180_000 });

    await expect
      .poll(async () => getLastCompletedStepCount(page), { timeout: 120_000 })
      .toBeGreaterThanOrEqual(4);

    await waitForChatNavigationIdle(page);

    const workflowToggle = page
      .locator("main")
      .getByRole("button", { name: /Workflow · \d+ steps completed/ })
      .last();
    await workflowToggle.click();

    const mainText = await page.locator("main").textContent();
    expect(mainText).toMatch(/Optimizing query for retrieval|Retrieving knowledge/);
  });

  test("AC-100: 7ai Assistant workflow has no RAG steps", async ({ page }) => {
    await waitForChatSidebarReady(page);
    const target = page
      .locator("aside nav ul li")
      .filter({ hasText: "7ai Assistant" })
      .first();
    test.skip((await target.count()) === 0, "Need 7ai Assistant conversation");

    await target.locator("div > button").first().click();
    await waitForConversationShell(page);

    const input = page.getByPlaceholder("Type a message");
    const message = `workflow regression ${Date.now()}`;
    await sendChatMessage(page, message);

    await expect(input).toBeEnabled({ timeout: 180_000 });

    await expect
      .poll(async () => getLastCompletedStepCount(page), { timeout: 120_000 })
      .toBeGreaterThanOrEqual(4);

    await waitForChatNavigationIdle(page);

    const workflowToggle = page
      .locator("main")
      .getByRole("button", { name: /Workflow · \d+ steps completed/ })
      .last();
    await workflowToggle.click();

    const mainText = await page.locator("main").textContent();
    expect(mainText).not.toContain("Optimizing query for retrieval");
    expect(mainText).not.toContain("Retrieving knowledge");
  });
});
