import { test, expect } from "@playwright/test";
import { TEST_USER, signUp, signIn } from "./helpers/auth";

const user = {
  ...TEST_USER,
  email: `test-auth-${Date.now()}@deazl-e2e.com`,
};

test.describe("Auth", () => {
  test("sign up redirects to planning", async ({ page }) => {
    await signUp(page, user);
    await expect(page).toHaveURL(/\/planning/);
  });

  test("sign in with valid credentials redirects to planning", async ({ page }) => {
    await signUp(page, user);
    await page.goto("/login");
    await signIn(page, user);
    await expect(page).toHaveURL(/\/planning/);
  });

  test("sign in with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/mot de passe/i).fill("wrongpassword");
    await page.getByRole("button", { name: /connexion/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to planning redirects to login", async ({ page }) => {
    await page.goto("/planning");
    await expect(page).toHaveURL(/\/login/);
  });
});
