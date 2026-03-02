import { test, expect } from "@playwright/test";
import { TEST_USER, signUp } from "./helpers/auth";

const user = {
  ...TEST_USER,
  email: `test-onboarding-${Date.now()}@deazl-e2e.com`,
};

test.describe("Onboarding", () => {
  test.beforeEach(async ({ page }) => {
    await signUp(page, user);
  });

  test("welcome page affiche le CTA", async ({ page }) => {
    await page.goto("/onboarding/welcome");
    await expect(page.getByRole("link", { name: /commencer/i })).toBeVisible();
  });

  test("household → stores après sélection", async ({ page }) => {
    await page.goto("/onboarding/household");
    await page.getByRole("button", { name: /solo/i }).click();
    await expect(page).toHaveURL(/\/onboarding\/stores/);
  });

  test("stores → planning après completion", async ({ page }) => {
    await page.goto("/onboarding/stores");
    await page.getByRole("button", { name: /passer/i }).click();
    await expect(page).toHaveURL(/\/planning/);
  });

  test("stores → planning avec magasins sélectionnés", async ({ page }) => {
    await page.goto("/onboarding/stores");
    await page.getByRole("button", { name: "Leclerc" }).click();
    await page.getByRole("button", { name: "Lidl" }).click();
    await expect(page.getByRole("button", { name: /démarrer/i })).toBeVisible();
    await page.getByRole("button", { name: /démarrer/i }).click();
    await expect(page).toHaveURL(/\/planning/);
  });

  test("la flèche retour sur stores ramène à household", async ({ page }) => {
    await page.goto("/onboarding/stores");
    await page.getByRole("link").filter({ hasText: "" }).first().click();
    await expect(page).toHaveURL(/\/onboarding\/household/);
  });
});
