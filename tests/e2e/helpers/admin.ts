import type { Page } from "@playwright/test";

function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function resolveAdminCredentials(): {
  email: string;
  password: string;
} | null {
  const email = (
    process.env.E2E_ADMIN_EMAIL ?? process.env.E2E_TEST_EMAIL
  )?.trim();
  const password = (
    process.env.E2E_ADMIN_PASSWORD ?? process.env.E2E_TEST_PASSWORD
  )?.trim();

  if (!email || !password) return null;

  const allowlist = parseAdminEmails();
  if (!allowlist.includes(email.toLowerCase())) return null;

  return { email, password };
}

export const hasAdminCredentials = Boolean(resolveAdminCredentials());

export async function loginAsAdmin(page: Page) {
  const creds = resolveAdminCredentials();
  if (!creds) {
    throw new Error(
      "Admin E2E credentials missing or not in ADMIN_EMAILS allowlist",
    );
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Email").fill(creds.email);
    await page.getByLabel("Password").fill(creds.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    try {
      await page.waitForURL(/\/chat/, {
        timeout: 20_000,
        waitUntil: "domcontentloaded",
      });
      return;
    } catch {
      if (attempt === 2) {
        throw new Error("Admin login failed after 3 attempts");
      }
    }
  }
}
