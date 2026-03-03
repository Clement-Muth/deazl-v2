import { Page } from "@playwright/test";

export const TEST_USER = {
  email: `test-${Date.now()}@deazl-e2e.com`,
  password: "TestPassword123!",
  displayName: "Test",
};

export async function signUp(page: Page, user = TEST_USER) {
  await page.goto("/register");
  await page.getByLabel("Prénom").fill(user.displayName);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Mot de passe").fill(user.password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await Promise.race([
    page.waitForURL(/\/(onboarding|planning)/),
    page.locator("p.text-destructive").waitFor({ timeout: 10000 }),
  ]);
  if (!page.url().match(/\/(onboarding|planning)/)) {
    await signIn(page, user);
  }
}

export async function signIn(page: Page, user = TEST_USER) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Mot de passe").fill(user.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/\/(onboarding|planning)/, { timeout: 10000 });
}
