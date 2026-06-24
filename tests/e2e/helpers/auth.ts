import type { Page } from "@playwright/test";

export const hasAuthCredentials =
  Boolean(process.env.E2E_TEST_EMAIL) && Boolean(process.env.E2E_TEST_PASSWORD);

export async function login(page: Page) {
  const email = process.env.E2E_TEST_EMAIL!;
  const password = process.env.E2E_TEST_PASSWORD!;

  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    try {
      await page.waitForURL(/\/chat/, {
        timeout: 20_000,
        waitUntil: "domcontentloaded",
      });
      return;
    } catch {
      if (attempt === 2) {
        throw new Error("Login failed after 3 attempts");
      }
    }
  }
}
