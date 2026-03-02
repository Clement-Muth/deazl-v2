import { Page } from "@playwright/test";

export const TEST_USER = {
  email: `test-${Date.now()}@deazl-e2e.com`,
  password: "TestPassword123!",
  displayName: "Test User",
};

export async function signUp(page: Page, user = TEST_USER) {
  await page.goto("/register");
  await page.getByLabel(/nom/i).fill(user.displayName);
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/mot de passe/i).fill(user.password);
  await page.getByRole("button", { name: /créer/i }).click();
}

export async function signIn(page: Page, user = TEST_USER) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/mot de passe/i).fill(user.password);
  await page.getByRole("button", { name: /connexion/i }).click();
}
