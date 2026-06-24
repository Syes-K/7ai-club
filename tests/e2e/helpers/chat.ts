import type { Page } from "@playwright/test";

export async function waitForChatSidebarReady(page: Page) {
  if (!/\/chat/.test(page.url())) {
    await page.goto("/chat", { waitUntil: "domcontentloaded" });
  }

  const loading = page.getByText("Loading conversations…");
  await loading.waitFor({ state: "hidden", timeout: 30_000 }).catch(() => {});

  await page
    .getByRole("complementary")
    .getByRole("button", { name: "New chat", exact: true })
    .waitFor({ state: "visible", timeout: 30_000 });
}

export function sidebarNewChatButton(page: Page) {
  return page
    .getByRole("complementary")
    .getByRole("button", { name: "New chat", exact: true });
}

export async function waitForConversationShell(page: Page) {
  await page.getByPlaceholder("Type a message").waitFor({
    state: "visible",
    timeout: 30_000,
  });
}
