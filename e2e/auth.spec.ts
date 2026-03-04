import { test, expect } from "@playwright/test";
import { TEST_USER, signUp, signIn } from "./helpers/auth";

const user = {
  ...TEST_USER,
  email: `test-auth-${Date.now()}@deazl-e2e.com`,
};

test.describe("Auth", () => {
  test("sign up redirects out of register", async ({ page }) => {
    await signUp(page, user);
    await expect(page).toHaveURL(/\/(onboarding|planning)/);
  });

  test("sign in with valid credentials redirects out of login", async ({ page }) => {
    await signUp(page, user);
    await signIn(page, user);
    await expect(page).toHaveURL(/\/(onboarding|planning)/);
  });

  test("sign in with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Mot de passe").fill("wrongpassword");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.locator("p.text-destructive")).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to planning redirects to login", async ({ page }) => {
    await page.goto("/planning");
    await expect(page).toHaveURL(/\/login/);
  });
});
