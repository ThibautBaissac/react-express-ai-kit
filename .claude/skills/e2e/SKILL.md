---
name: e2e
description: "Author and run Playwright browser e2e specs against the real Express + Vite stack — specs in e2e/, role-based queries, the auto-starting webServer, port-overridable isolation, and the responsive screenshot-artifact pattern."
when_to_use: "Use WHEN adding or changing a browser end-to-end flow, a Playwright spec, a cross-stack smoke/health check, or a responsive screenshot capture — whether the user asks directly or an implementation agent is realizing a matching To-Do item from a `tasks/task-N.md` plan. Do NOT use for unit/integration tests (those are colocated vitest/RTL specs — use /write-tests), and do NOT use just to run the existing quality gate (use /run-checks; e2e stays out of that gate by design)."
argument-hint: "[flow-or-spec-name]"
arguments: [target]
model: sonnet
---

# Author e2e to convention

Add a Playwright spec for `$target` against the real running stack. Specs live in
`e2e/`, are vendor-neutral (no model-specific browser tool), and drive a real
Express API + Vite web server that Playwright starts and stops itself.

## Step 1 — Detect toolchain and read conventions

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
```

Open `e2e/app.spec.ts` and `e2e/responsive.spec.ts` first and match their style.
Skim `playwright.config.ts` comments for the isolation model. Reuse the existing
patterns before inventing new ones.

## Step 2 — Place the spec

- Write to `e2e/<name>.spec.ts` — e2e specs are **not** colocated with source.
- Import from `@playwright/test`; query by role/label/text, not CSS selectors or
  test IDs, mirroring `app.spec.ts`.
- One observable user outcome per test; assert behavior, not internals.

## Step 3 — Respect the webServer + isolation model

- Do **not** start `pnpm dev` by hand. Playwright's `webServer` boots the API and
  web server and waits on `/api/health`.
- If the flow needs persisted data, restore migrate + seed of the isolated
  `./e2e.db` in the API `webServer` command (the starter shell skips this) — use
  `/scaffold-seed` for the seed itself; never seed the dev database.
- Parse any data the test sets up through the feature's existing zod schema.
- Assume ports are env-overridable (`E2E_WEB_PORT` / `E2E_API_PORT`) so concurrent
  task agents don't collide; never hardcode `localhost:3100`/`3000` — use
  `baseURL` and relative paths. For parallel task runs, also isolate the database
  per task, e.g. `E2E_WEB_PORT=$((3100 + $task)) E2E_API_PORT=$((3200 + $task))
  E2E_DATABASE_URL=./e2e-$task.db pnpm e2e`. Single-agent runs need none of this.

## Step 4 — Capture responsive artifacts (when graded)

For visual review, extend the `responsive.spec.ts` pattern: drive the two graded
breakpoints (375px mobile, 1440px desktop) and write `fullPage` screenshots to
`e2e/screenshots/`. These specs capture artifacts; they do not assert aesthetics.

## Step 5 — Run and report

`pm_run` is a shell function from the detector, not a binary — source it in the
same block that calls it (shell state does not persist between blocks).

```bash
source "${CLAUDE_PROJECT_DIR}/.claude/lib/detect-toolchain.sh"
pm_run e2e            # or: pm_run e2e <spec-path>
pm_run e2e:report     # open the last HTML report on failure
```

On failure, diagnose from the report and trace rather than re-running blind:
`pm_run e2e:report` opens the HTML report, and `npx playwright show-trace`
replays a run with console + network captured.

Iterate until green. Report the flows covered and any screenshots written; don't
paste full Playwright logs.

## Checklist

- [ ] Spec lives in `e2e/`, not colocated with source.
- [ ] Queries are role/label/text-based; assertions target user-visible behavior.
- [ ] No dev servers started by hand; relies on Playwright's `webServer`.
- [ ] No hardcoded ports — uses `baseURL` and relative URLs.
- [ ] Persisted-data flows seed the isolated `e2e.db`, never the dev DB.
- [ ] Responsive captures write 375/1440 screenshots to `e2e/screenshots/`.
- [ ] Suite passes via the detected package manager (`pm_run e2e`).
