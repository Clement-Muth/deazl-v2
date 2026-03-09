import { test, expect } from "@playwright/test";
import { TEST_USER, signUp } from "./helpers/auth";

const user = {
  ...TEST_USER,
  email: `test-onboarding-${Date.now()}@deazl-e2e.com`,
};

test.describe("Onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page, user);
    await page.goto("/onboarding/welcome");
  });

  test("welcome page shows CTA", async ({ page }) => {
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
  });

  test("welcome CTA navigates to household", async ({ page }) => {
    await page.getByRole("link", { name: /get started/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/household/);
  });

  test("back arrow on stores returns to household", async ({ page }) => {
    await page.goto("/onboarding/stores");
    await page.getByRole("link").first().click();
    await expect(page).toHaveURL(/\/onboarding\/household/);
  });

  test("unauthenticated user can view welcome page", async ({ page: anonPage, context }) => {
    const freshPage = await context.newPage();
    await freshPage.goto("/onboarding/welcome");
    await expect(freshPage.getByRole("link", { name: /get started/i })).toBeVisible();
  });
});
