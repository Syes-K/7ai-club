import { expect, test } from "@playwright/test";
import { hasAuthCredentials, login } from "./helpers/auth";
import {
  sidebarNewChatButton,
  waitForChatSidebarReady,
  waitForConversationShell,
} from "./helpers/chat";

const hasEmbeddingKey = Boolean(process.env.SILICONFLOW_API_KEY?.trim());

test.describe("iter-10 post-release polish", () => {
  test.describe("landing & auth (public)", () => {
    test("AC-101: landing footer sticks to viewport bottom on large screens", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/");

      const footer = page.locator("footer");
      await expect(footer).toBeVisible();
      await expect(footer).toContainText("SYS://local");

      const footerBox = await footer.boundingBox();
      const viewport = page.viewportSize();
      expect(footerBox).not.toBeNull();
      expect(viewport).not.toBeNull();
      if (footerBox && viewport) {
        expect(footerBox.y + footerBox.height).toBeGreaterThanOrEqual(
          viewport.height - 80,
        );
      }

      await expect(page.getByRole("link", { name: "Start chat" })).toBeVisible();
      await expect(page.getByText("[06] MCP & tools")).toBeVisible();
    });

    test("AC-102: capability grid shows six items with expected links", async ({
      page,
    }) => {
      await page.goto("/");

      await expect(page.getByText("[01] Streaming & models")).toBeVisible();
      await expect(page.getByText("[02] Knowledge & routing")).toBeVisible();
      await expect(page.getByText("[03] Assistant & personas")).toBeVisible();
      await expect(page.getByText("[04] Workflow & steps")).toBeVisible();
      await expect(page.getByText("[05] Prompts & configs")).toBeVisible();
      await expect(page.getByText("[06] MCP & tools")).toBeVisible();

      await expect(
        page.getByRole("link", { name: "[01] Streaming & models" }),
      ).toHaveAttribute("href", "/chat");
      await expect(
        page.getByRole("link", { name: "[02] Knowledge & routing" }),
      ).toHaveAttribute("href", "/console/knowledge");
      await expect(
        page.getByRole("link", { name: "[03] Assistant & personas" }),
      ).toHaveAttribute("href", "/console/assistants");
      await expect(
        page.getByRole("link", { name: "[05] Prompts & configs" }),
      ).toHaveAttribute("href", "/console/models");
    });

    test("AC-103: unauthenticated header has Sign in only (no Chat or Register)", async ({
      page,
    }) => {
      await page.goto("/");

      const header = page.locator("header");
      await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
      await expect(header.getByRole("link", { name: "Register" })).toHaveCount(0);
      await expect(header.getByRole("link", { name: "Chat", exact: true })).toHaveCount(
        0,
      );
    });

    test("AC-104: auth switch preserves next query param", async ({ page }) => {
      await page.goto("/login?next=/chat");
      await expect(page.getByRole("link", { name: "Sign up" })).toHaveAttribute(
        "href",
        "/register?next=%2Fchat",
      );
    });
  });

  test.describe("authenticated shell", () => {
    test.skip(!hasAuthCredentials, "Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD");
    test.describe.configure({ mode: "serial" });

    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test("AC-103: signed-in landing header uses user menu (no top-level Chat)", async ({
      page,
    }) => {
      await page.goto("/");
      const header = page.locator("header");
      await expect(header.getByRole("link", { name: "Chat", exact: true })).toHaveCount(
        0,
      );
      await expect(header.getByRole("button", { expanded: false })).toBeVisible();
    });

    test("AC-105: assistant picker shows Manage assistants link", async ({
      page,
    }) => {
      await waitForChatSidebarReady(page);
      await sidebarNewChatButton(page).click();

      await expect(
        page.getByRole("heading", { name: "Choose an assistant" }),
      ).toBeVisible();

      const manageLink = page.getByRole("link", { name: "Manage assistants" });
      await expect(manageLink).toBeVisible();
      await expect(manageLink).toHaveAttribute("href", "/console/assistants");

      await manageLink.click();
      await expect(page).toHaveURL(/\/console\/assistants$/);
      await expect(
        page.getByRole("heading", { name: "Assistants" }),
      ).toBeVisible();

      await page.keyboard.press("Escape");
    });

    test("AC-110b: assistants create deep link opens form dialog", async ({
      page,
    }) => {
      await page.goto("/console/assistants?create=1");
      await expect(
        page.getByRole("heading", { name: "Create assistant" }),
      ).toBeVisible({ timeout: 30_000 });
      await expect(page).toHaveURL(/\/console\/assistants$/);
    });

    test("AC-106: profile shows query optimization default disabled", async ({
      page,
    }) => {
      await page.goto("/console/profile");
      await expect(
        page.getByRole("heading", { name: "Preferences" }),
      ).toBeVisible({ timeout: 30_000 });

      const preferences = page.locator("section").filter({
        has: page.getByRole("heading", { name: "Preferences" }),
      });
      await expect(preferences.getByText("Query optimization:")).toBeVisible();
      await expect(preferences.getByText("Disabled")).toBeVisible();
    });

    test("AC-108: recall test opens dialog from knowledge base list", async ({
      page,
    }) => {
      test.skip(!hasEmbeddingKey, "Set SILICONFLOW_API_KEY for recall test");

      await page.goto("/console/knowledge");
      await expect(
        page.getByRole("heading", { name: "Knowledge Base" }),
      ).toBeVisible();

      const readyRow = page
        .locator("tr")
        .filter({ hasText: "Ready" })
        .first();
      test.skip((await readyRow.count()) === 0, "Need at least one Ready KB");

      await readyRow.getByRole("button", { name: "Recall test" }).click();
      const recallDialog = page.getByRole("dialog").filter({
        has: page.getByRole("heading", { name: "Recall test" }),
      });
      await expect(recallDialog).toBeVisible();
      await expect(
        recallDialog.getByPlaceholder("Ask a question to test retrieval"),
      ).toBeVisible();
      await expect(recallDialog.getByLabel("Query optimization")).toBeVisible();
      await page.keyboard.press("Escape");
    });

    test("AC-107: chat skips optimize step when preference disabled", async ({
      page,
    }) => {
      test.skip(!hasEmbeddingKey, "Set SILICONFLOW_API_KEY for RAG chat E2E");

      await page.goto("/console/profile");
      const preferences = page.locator("section").filter({
        has: page.getByRole("heading", { name: "Preferences" }),
      });
      const editBtn = preferences.getByRole("button", { name: "Edit" });
      if (await editBtn.isVisible()) {
        await editBtn.click();
        const optimizeCheckbox = preferences.getByLabel("Query optimization");
        if (await optimizeCheckbox.isChecked()) {
          await optimizeCheckbox.uncheck();
          await preferences.getByRole("button", { name: "Save" }).click();
          await expect(preferences.getByText("Saved")).toBeVisible({
            timeout: 15_000,
          });
        } else {
          await page.keyboard.press("Escape");
        }
      }

      await waitForChatSidebarReady(page);
      const ragItem = page
        .locator("aside nav ul li")
        .filter({ hasText: "E2E RAG" })
        .first();
      test.skip((await ragItem.count()) === 0, "Need E2E RAG assistant conversation");

      await ragItem.locator("div > button").first().click();
      await waitForConversationShell(page);

      const input = page.getByPlaceholder("Type a message");
      await expect(input).toBeEnabled({ timeout: 60_000 });
      await input.fill(`iter10 optimize off ${Date.now()}`);
      await page.getByRole("button", { name: "Send message" }).click();
      await expect(input).toBeEnabled({ timeout: 180_000 });

      const workflowToggle = page
        .locator("main")
        .getByRole("button", { name: /Workflow · \d+ steps completed/ })
        .last();
      await workflowToggle.click();

      const mainText = await page.locator("main").textContent();
      expect(mainText).toContain("Retrieving knowledge");
      expect(mainText).not.toContain("Optimizing query for retrieval");
    });

    test("AC-110: console list pages load with table actions", async ({
      page,
    }) => {
      for (const path of [
        "/console/models",
        "/console/knowledge",
        "/console/assistants",
      ]) {
        await page.goto(path);
        await expect(page.locator("table")).toBeVisible({ timeout: 30_000 });
        await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
      }
    });
  });
});
