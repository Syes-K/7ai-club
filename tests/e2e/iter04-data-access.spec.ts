import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import {
  sidebarNewChatButton,
  waitForChatSidebarReady,
} from "./helpers/chat";

const hasAuthCredentials =
  Boolean(process.env.E2E_TEST_EMAIL) && Boolean(process.env.E2E_TEST_PASSWORD);

/** Conversation IDs created during the current test — cleaned up in afterEach. */
const createdConversationIds: string[] = [];

function getConversationIdFromPage(page: Page): string {
  const match = page.url().match(/\/chat\/([^/?#]+)/);
  if (!match) {
    throw new Error(`Expected /chat/:id URL, got ${page.url()}`);
  }
  return match[1];
}

async function conversationCount(page: Page): Promise<number> {
  await waitForChatSidebarReady(page);
  return page.locator("aside nav ul li").count();
}

async function createConversation(page: Page): Promise<string> {
  await waitForChatSidebarReady(page);
  const newChatBtn = sidebarNewChatButton(page);
  await newChatBtn.click();
  await expect(
    page.getByRole("heading", { name: "Choose an assistant" }),
  ).toBeVisible();

  const option = page.getByRole("option").first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click();
  await page.getByRole("button", { name: "Create chat" }).click();

  await expect(
    page.getByRole("heading", { name: "Choose an assistant" }),
  ).toBeHidden({ timeout: 30_000 });
  await waitForConversationShell(page);

  const id = getConversationIdFromPage(page);
  createdConversationIds.push(id);
  return id;
}

async function ensureConversations(page: Page, minimum: number): Promise<string[]> {
  const created: string[] = [];
  let count = await conversationCount(page);
  while (count < minimum) {
    const id = await createConversation(page);
    created.push(id);
    count = await conversationCount(page);
  }
  return created;
}

async function deleteConversationById(page: Page, conversationId: string) {
  await page.goto(`/chat/${conversationId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Loading conversation…")).toBeHidden({
    timeout: 30_000,
  });

  const activeItem = page
    .locator("aside nav ul li")
    .filter({ has: page.locator('span.absolute[aria-hidden="true"]') })
    .first();
  await activeItem.hover();
  await activeItem.getByRole("button", { name: /^Delete / }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Delete conversation?" })).toBeHidden({
    timeout: 15_000,
  });
}

async function deleteCreatedConversations(page: Page) {
  const ids = [...createdConversationIds].reverse();
  for (const id of ids) {
    try {
      await deleteConversationById(page, id);
    } catch {
      // Best-effort cleanup so one failure does not block the rest.
    }
  }
  createdConversationIds.length = 0;
}

async function waitForConversationShell(page: Page) {
  await page.waitForURL(/\/chat\/[^/]+$/, { timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Clear chat" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Loading conversation…")).toBeHidden({
    timeout: 30_000,
  });
}

async function openFirstConversation(page: Page) {
  await waitForChatSidebarReady(page);
  const first = page.locator("aside nav ul li").first();
  if ((await first.count()) === 0) return false;
  await first.locator("div > button").first().click();
  await waitForConversationShell(page);
  return true;
}

test.describe("iter-04 data access", () => {
  test.skip(!hasAuthCredentials, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD");
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    createdConversationIds.length = 0;
    await login(page);
  });

  test.afterEach(async ({ page }) => {
    await deleteCreatedConversations(page);
  });

  test("AC-30: switching conversations does not call /session BFF", async ({
    page,
  }) => {
    await ensureConversations(page, 2);

    const sessionRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/api/conversations") && url.includes("/session")) {
        sessionRequests.push(url);
      }
    });

    await page.goto("/chat");
    await waitForChatSidebarReady(page);
    const items = page.locator("aside nav ul li");
    await items.nth(0).locator("div > button").first().click();
    await page.getByPlaceholder("Type a message").waitFor({ state: "visible" });

    await items.nth(1).locator("div > button").first().click();
    await page.getByPlaceholder("Type a message").waitFor({ state: "visible" });

    expect(sessionRequests).toEqual([]);
  });

  test("AC-31: profile saves via browser layer (no profile BFF)", async ({
    page,
  }) => {
    const profileApiRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/api/profile")) {
        profileApiRequests.push(url);
      }
    });

    await page.goto("/console/profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    const account = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Account" }),
    });
    await account.getByRole("button", { name: "Edit" }).click();

    const uniqueNick = `E2E ${Date.now()}`;
    await account.getByLabel("Nickname").fill(uniqueNick);
    await account.getByRole("button", { name: "Save" }).click();
    await expect(account.getByText("Saved.")).toBeVisible({ timeout: 15_000 });

    expect(profileApiRequests).toEqual([]);
  });

  test("AC-32: assistants page loads without assistants BFF", async ({
    page,
  }) => {
    const assistantsApiRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/api/assistants")) {
        assistantsApiRequests.push(url);
      }
    });

    await page.goto("/console/assistants");
    await expect(
      page.getByRole("heading", { name: /assistants/i }),
    ).toBeVisible();

    expect(assistantsApiRequests).toEqual([]);
  });

  test("AC-34: chat uses /api/chat only (no conversations BFF on send)", async ({
    page,
  }) => {
    await ensureConversations(page, 1);

    const chatApiRequests: string[] = [];
    const otherAppApiRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (!url.includes("/api/")) return;
      if (url.includes("/api/chat")) {
        chatApiRequests.push(url);
        return;
      }
      otherAppApiRequests.push(url);
    });

    const hasChat = await openFirstConversation(page);
    expect(hasChat).toBe(true);

    const input = page.getByPlaceholder("Type a message");
    await input.fill("iter-04 e2e ping");
    await expect(page.getByRole("button", { name: "Send message" })).toBeEnabled({
      timeout: 15_000,
    });
    await input.press("Enter");

    await expect
      .poll(() => chatApiRequests.length > 0, {
        timeout: 30_000,
      })
      .toBe(true);

    expect(
      otherAppApiRequests.every((url) => !url.includes("/api/conversations")),
    ).toBe(true);
  });
});
