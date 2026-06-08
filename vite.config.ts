import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls to the Express server during dev. The target is
    // overridable so e2e runs can point the web server at an isolated API port
    // (see playwright.config.ts); defaults to the standard dev API on :3000.
    proxy: {
      "/api": process.env.E2E_API_TARGET ?? "http://localhost:3000",
    },
  },
  test: {
    // e2e/*.spec.ts are Playwright tests — keep Vitest out of them.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
