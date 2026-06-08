import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";

// These tests do not assert aesthetics — "breathing, responsive UI" is a graded
// judgment a human or vision-capable agent must make. Their job is to capture
// deterministic screenshots at the two graded breakpoints (375px mobile, 1440px
// desktop) into e2e/screenshots/ so any reviewer can inspect them without a
// vendor-specific browser tool. Extend with feature-specific captures as the app
// grows.

const SCREENSHOT_DIR = "e2e/screenshots";

const breakpoints = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

test.describe("responsive screenshot artifacts (for visual review)", () => {
  test.beforeAll(() => {
    mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  for (const bp of breakpoints) {
    test(`home page @ ${bp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto("/");
      await page
        .getByRole("heading", { name: "react-express-ai-kit" })
        .waitFor();
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/home-${bp.name}.png`,
        fullPage: true,
      });
    });
  }
});
