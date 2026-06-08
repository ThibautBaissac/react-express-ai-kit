import { defineConfig, devices } from "@playwright/test";

// Vendor-neutral browser verification: runs for any agent (Claude, Codex), CI,
// or a human via `pnpm e2e`.
//
// Isolation: e2e drives a real Express + Vite stack against a dedicated
// `./e2e.db` so runs never read or mutate the dev database. The API webServer
// migrates + seeds that DB before listening, so the suite is reproducible from
// a clean checkout.
//
// Ports and DB path are env-overridable so concurrent task agents can run the
// suite without colliding, e.g.:
//   E2E_WEB_PORT=3104 E2E_API_PORT=3204 E2E_DATABASE_URL=./e2e-4.db pnpm e2e
// Single-agent runs need no env — the defaults below just work.

const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 3100);
const API_PORT = Number(process.env.E2E_API_PORT ?? 3000);
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? "./e2e.db";

export default defineConfig({
  testDir: "./e2e",
  // One web server + one SQLite file are shared across tests; run serially so
  // login/logout flows in different tests never race on shared state.
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
      // Migrate + seed the isolated e2e DB, then start the API. The healthcheck
      // URL only responds once all three steps complete, so tests never hit an
      // unseeded database.
      command: "pnpm db:migrate && pnpm db:seed && pnpm dev:api",
      url: `http://localhost:${API_PORT}/api/health`,
      env: { DATABASE_URL: E2E_DATABASE_URL, PORT: String(API_PORT) },
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
