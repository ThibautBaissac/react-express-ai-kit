import { test, expect, type Page } from "@playwright/test";

// Seeded demo author (see scripts/seed.ts).
const EMAIL = "camille@bonnes-feuilles.test";
const PASSWORD = "demo1234";
const AUTHOR_NAME = "Camille Laurent";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe("Task 4 — frontend auth flow", () => {
  test("redirects an unauthenticated visitor from a protected route to /login", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "Les Bonnes Feuilles" }),
    ).toBeVisible();
  });

  test("shows an accessible inline error on invalid credentials", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Mot de passe").fill("wrongpassword");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(
      page.getByText("Email ou mot de passe invalide."),
    ).toBeVisible();
    // Still on the login page — no navigation on failure.
    await expect(page).toHaveURL(/\/login$/);
  });

  test("logs in with valid credentials and lands in the app shell", async ({
    page,
  }) => {
    await login(page);
    await expect(page.getByText(AUTHOR_NAME)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Se déconnecter" }),
    ).toBeVisible();
  });

  test("redirects an authenticated visitor away from /login", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(AUTHOR_NAME)).toBeVisible();
  });

  test("logout clears the session and returns to /login", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/login$/);

    // Session is gone: a protected route bounces back to /login.
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });
});
