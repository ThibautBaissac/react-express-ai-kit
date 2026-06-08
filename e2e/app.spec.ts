import { test, expect } from "@playwright/test";

test("renders the app shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "react-express-ai-kit" }),
  ).toBeVisible();
});

test("serves the API health endpoint through the Vite proxy", async ({
  request,
}) => {
  const response = await request.get("/api/health");

  await expect(response).toBeOK();
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});
