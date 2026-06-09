# Browser e2e runbook

Browser checks run through **Playwright** (`pnpm e2e`). The authoring procedure
for new specs is the `/e2e` skill; this runbook is the shared *what to run and
how to verify* that the workflow commands point to.

## Browser / visual verification

1. **Functional flows** (navigation, forms, auth, redirects, 404s): add or extend asserted specs in `e2e/*.spec.ts`, then run `pnpm e2e`. Playwright's `webServer` migrates + seeds an isolated `./e2e.db` and starts/stops the Express API and Vite web server automatically — do **not** start or stop dev servers by hand.
2. **Graded visual / responsive checks** (a UI that "breathes" at 375px and 1440px): `e2e/responsive.spec.ts` writes screenshots to `e2e/screenshots/`. Run `pnpm e2e`, then open/read those PNGs and judge the layout — Playwright captures, the aesthetic call is yours.
3. **Parallel task runs only** (avoid port/DB collisions; single-agent runs need nothing extra): `E2E_WEB_PORT=$((3100 + $task)) E2E_API_PORT=$((3200 + $task)) E2E_DATABASE_URL=./e2e-$task.db pnpm e2e`

## Diagnosing failures

Read the report and trace rather than re-running blind: `pnpm e2e:report` opens
the HTML report, and `npx playwright show-trace` replays a run with console +
network captured.
