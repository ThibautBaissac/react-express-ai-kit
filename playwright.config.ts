import { defineConfig, devices } from "@playwright/test";

// Vendor-neutral browser verification: runs for any agent (Claude, Codex), CI,
// or a human via `pnpm e2e`.
//
// Isolation: e2e drives a real Express + Vite stack. The starter suite only
// checks the app shell and API health endpoint, so it does not require database
// migrations or seed data. Projects with persisted features can add those steps
// back to the API webServer command.
//
// Ports are env-overridable so concurrent task agents can run the suite without
// colliding, e.g.:
//   E2E_WEB_PORT=3104 E2E_API_PORT=3204 pnpm e2e
// Single-agent runs need no env — the defaults below just work.

const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3100);
const API_PORT = Number(process.env.E2E_API_PORT ?? 3000);
export default defineConfig({
  testDir: "./e2e",
  // The suite shares one real API server and one Vite server.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "on-first-retry",
    // Desktop viewport by default; responsive.spec.ts overrides per-test to
    // capture 375px / 1440px artifacts.
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      command: "pnpm dev:api",
      url: `http://localhost:${API_PORT}/api/health`,
      env: { PORT: String(API_PORT) },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `pnpm dev:web --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      // Point the Vite proxy at the (possibly overridden) API port.
      env: { E2E_API_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
